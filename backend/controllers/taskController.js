// backend/controllers/taskController.js
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Task = require('../models/Task');
const Project = require('../models/Project');
const notify = require('../utils/notify');
const Notification = require('../models/Notification');

/**
 * Helper: emit via socket (if available)
 */
function emitToProject(req, projectId, event, payload) {
  try {
    const io = req.app.get('io');
    if (io && projectId) io.to(`project:${String(projectId)}`).emit(event, payload);
  } catch (err) {
    console.error('emitToProject failed', err);
  }
}
function emitToUser(req, userId, event, payload) {
  try {
    const io = req.app.get('io');
    if (io && userId) io.to(`user:${String(userId)}`).emit(event, payload);
  } catch (err) {
    console.error('emitToUser failed', err);
  }
}

/**
 * GET /api/tasks?project=<projectId>
 */
// GET /api/tasks?project=&q=&status=&assignee=&priority=&dueBefore=&dueAfter=&page=&limit=
exports.getTasks = asyncHandler(async (req, res) => {
  const { project, q, status, assignee, priority, dueBefore, dueAfter, page = 1, limit = 50 } = req.query;
  const filter = {};
  if (project) filter.project = project;
  if (status) filter.status = status;
  if (assignee) filter.assignee = assignee;
  if (priority) filter.priority = priority;
  if (dueBefore || dueAfter) filter.dueDate = {};
  if (dueBefore) filter.dueDate.$lte = new Date(dueBefore);
  if (dueAfter) filter.dueDate.$gte = new Date(dueAfter);

  if (q) {
    filter.$or = [
      { title: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } }
    ];
  }

  const skip = (parseInt(page)-1) * parseInt(limit);
  const tasks = await Task.find(filter)
    .populate('assignee','name email')
    .populate('project','title owner members')
    .skip(skip).limit(parseInt(limit)).sort({ dueDate: 1 });

  const visible = tasks.filter(t => {
    const p = t.project;
    if (!p) return false;
    if (p.owner.equals(req.user._id)) return true;
    if ((p.members || []).some(m => m.equals(req.user._id))) return true;
    if (t.assignee && t.assignee._id.equals(req.user._id)) return true;
    return false;
  });

  res.json(visible);
});



exports.createTask = asyncHandler(async (req, res) => {
  const { title, description, project, assignee, status, priority, dueDate } = req.body;
  if (!title || !project) { res.status(400); throw new Error('Title and project required'); }

  if (!mongoose.isValidObjectId(project)) {
    res.status(400); throw new Error('Invalid project id format');
  }

  const proj = await Project.findById(project);
  if (!proj) { res.status(404); throw new Error('Project not found'); }

  // permission: owner or member or admin
  const isRelated = (proj.owner && proj.owner.equals(req.user._id)) ||
    (proj.members || []).some(m => m.equals(req.user._id)) ||
    req.user.role === 'admin';
  if (!isRelated) { res.status(403); throw new Error('Not allowed to create tasks in this project'); }

  const toCreate = {
    title,
    description: description || '',
    project,
    assignee: assignee || null,
    status: status || 'todo',
    priority: priority || 'medium',
    dueDate: dueDate || null
  };

  const task = await Task.create(toCreate);

  // populate for response and notifications
  const populated = await Task.findById(task._id)
    .populate('assignee', 'name email')
    .populate('project', 'title owner members')
    .lean();

  // notify assignee if present
  if (populated.assignee) {
    await notify({
      req,
      userId: populated.assignee._id,
      actorId: req.user._id,
      type: 'task_assigned',
      title: `New task assigned: ${populated.title}`,
      body: `You were assigned a task in project "${populated.project.title}"`,
      link: `/projects/${populated.project._id}/tasks/${populated._id}`
    });
    emitToUser(req, populated.assignee._id, 'notification', { type: 'task_assigned', task: populated });
  }

  // emit to project room so connected clients update UI
  emitToProject(req, populated.project._id, 'taskCreated', populated);

  res.status(201).json(populated);
});

/**
 * GET /api/tasks/:id
 */
exports.getTaskById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) { res.status(400); throw new Error('Invalid task id'); }

  const task = await Task.findById(id)
    .populate('assignee', 'name email')
    .populate('project', 'title owner members');

  if (!task) { res.status(404); throw new Error('Task not found'); }

  const p = task.project;
  const isRelated = (p.owner && p.owner.equals(req.user._id)) ||
    (p.members || []).some(m => m.equals(req.user._id)) ||
    req.user.role === 'admin' ||
    (task.assignee && task.assignee.equals && task.assignee.equals(req.user._id));

  if (!isRelated) { res.status(403); throw new Error('Forbidden'); }

  res.json(task);
});

/**
 * PUT /api/tasks/:id
 * Handles updates including status changes (Kanban)
 */
exports.updateTask = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) { res.status(400); throw new Error('Invalid task id'); }

  // load with project and assignee (assignee might be id)
  const task = await Task.findById(id).populate('project', 'title owner members').populate('assignee', 'name email');
  if (!task) { res.status(404); throw new Error('Task not found'); }

  // permission: assignee, project owner, project member, or admin
  const isAssignee = task.assignee && task.assignee._id ? task.assignee._id.equals(req.user._id) : (task.assignee && task.assignee.equals && task.assignee.equals(req.user._id));
  const isOwner = task.project && task.project.owner && task.project.owner.equals(req.user._id);
  const isMember = task.project && (task.project.members || []).some(m => m.equals(req.user._id));
  const canUpdate = isAssignee || isOwner || isMember || req.user.role === 'admin';
  if (!canUpdate) { res.status(403); throw new Error('Not allowed to update task'); }

  // capture old values for notifications
  const oldStatus = task.status;
  const oldAssigneeId = task.assignee && task.assignee._id ? String(task.assignee._id) : (task.assignee ? String(task.assignee) : null);

  // apply fields
  const fields = ['title','description','assignee','status','priority','dueDate'];
  fields.forEach(f => {
    if (req.body[f] !== undefined) task[f] = req.body[f];
  });

  await task.save();

  // re-populate for notifications/response
  const populated = await Task.findById(task._id)
    .populate('assignee', 'name email')
    .populate('project', 'title owner members')
    .lean();

  // If assignee changed, notify new assignee
  const newAssigneeId = populated.assignee ? String(populated.assignee._id) : null;
  if (newAssigneeId && newAssigneeId !== oldAssigneeId) {
    await notify({
      req,
      userId: newAssigneeId,
      actorId: req.user._id,
      type: 'task_assigned',
      title: `You were assigned: ${populated.title}`,
      body: `Assigned in project "${populated.project.title}"`,
      link: `/projects/${populated.project._id}/tasks/${populated._id}`
    });
    emitToUser(req, newAssigneeId, 'notification', { type: 'task_assigned', task: populated });
  }

  // If status changed, notify assignee and project owner
  if (req.body.status && req.body.status !== oldStatus) {
    // notify current assignee (if exists)
    if (populated.assignee) {
      await notify({
        req,
        userId: populated.assignee._id,
        actorId: req.user._id,
        type: 'task_updated',
        title: `Task status changed: ${populated.title}`,
        body: `Status is now: ${populated.status}`,
        link: `/projects/${populated.project._id}/tasks/${populated._id}`
      });
      emitToUser(req, populated.assignee._id, 'notification', { type: 'task_updated', task: populated });
    }

    // notify project owner
    if (populated.project && populated.project.owner) {
      const ownerId = populated.project.owner;
      await notify({
        req,
        userId: ownerId,
        actorId: req.user._id,
        type: 'task_updated',
        title: `Task status changed in your project: ${populated.title}`,
        body: `Status: ${populated.status}`,
        link: `/projects/${populated.project._id}/tasks/${populated._id}`
      });
      emitToUser(req, ownerId, 'notification', { type: 'task_updated', task: populated });
    }
  }

  // Emit update to project room for real-time UI update
  emitToProject(req, populated.project._id, 'taskUpdated', populated);

  res.json(populated);
});

/**
 * DELETE /api/tasks/:id
 */
exports.deleteTask = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) { res.status(400); throw new Error('Invalid task id'); }

  const task = await Task.findById(id).populate('project', 'owner title');
  if (!task) { res.status(404); throw new Error('Task not found'); }

  if (!task.project.owner.equals(req.user._id) && req.user.role !== 'admin') {
    res.status(403); throw new Error('Only project owner or admin can delete tasks');
  }

  await task.remove();

  // emit to project that a task was deleted
  emitToProject(req, task.project._id, 'taskDeleted', { taskId: id });

  // Optionally notify assignee that task was removed
  if (task.assignee) {
    await notify({
      req,
      userId: task.assignee,
      actorId: req.user._id,
      type: 'task_deleted',
      title: `Task removed: ${task.title}`,
      body: `Task removed from project "${task.project.title}"`,
      link: `/projects/${task.project._id}`
    });
    emitToUser(req, task.assignee, 'notification', { type: 'task_deleted', taskId: id });
  }

  res.json({ message: 'Task removed' });
});
