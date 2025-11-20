const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Task = require('../models/Task');
const Project = require('../models/Project');
const Comment = require('../models/Comment');
const User = require('../models/User');
const notify = require('../utils/notify');
const Notification = require('../models/Notification');

const validStatuses = ['todo', 'inprogress', 'done'];
const validPriorities = ['low', 'medium', 'high'];


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


exports.getTasks = asyncHandler(async (req, res) => {
  const { project, q, status, assignee, priority, dueBefore, dueAfter, page = 1, limit = 50 } = req.query;
  const filter = {};
  
  // Validate and filter by project
  if (project) {
    if (!mongoose.isValidObjectId(project)) {
      res.status(400);
      throw new Error('Invalid project id format');
    }
    filter.project = project;
  }
  
  // Validate and filter by status
  if (status) {
    if (!validStatuses.includes(status)) {
      res.status(400);
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }
    filter.status = status;
  }
  
  // Validate and filter by assignee
  if (assignee) {
    if (!mongoose.isValidObjectId(assignee)) {
      res.status(400);
      throw new Error('Invalid assignee id format');
    }
    filter.assignee = assignee;
  }
  
  // Validate and filter by priority
  if (priority) {
    if (!validPriorities.includes(priority)) {
      res.status(400);
      throw new Error(`Invalid priority. Must be one of: ${validPriorities.join(', ')}`);
    }
    filter.priority = priority;
  }
  
  if (dueBefore || dueAfter) filter.dueDate = {};
  if (dueBefore) filter.dueDate.$lte = new Date(dueBefore);
  if (dueAfter) filter.dueDate.$gte = new Date(dueAfter);

  if (q) {
    filter.$or = [
      { title: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } }
    ];
  }

  // Validate and sanitize pagination
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 50));
  const skip = (pageNum - 1) * limitNum;
  
  const tasks = await Task.find(filter)
    .populate('assignee','name email')
    .populate('project','title owner members')
    .skip(skip).limit(limitNum).sort({ dueDate: 1 });

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

  // Validate assignee if provided
  let assigneeId = null;
  if (assignee) {
    if (!mongoose.isValidObjectId(assignee)) {
      res.status(400);
      throw new Error('Invalid assignee id format');
    }
    const assigneeUser = await User.findById(assignee);
    if (!assigneeUser) {
      res.status(404);
      throw new Error('Assignee not found');
    }
    // Verify assignee is a project member or owner
    const isMember = (proj.members || []).some(m => m.equals(assignee)) || 
                     proj.owner.equals(assignee);
    if (!isMember) {
      res.status(403);
      throw new Error('Assignee must be a project member or owner');
    }
    assigneeId = assignee;
  }

  // Validate status enum
  const taskStatus = status || 'todo';
  if (!validStatuses.includes(taskStatus)) {
    res.status(400);
    throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
  }

  // Validate priority enum
  const taskPriority = priority || 'medium';
  if (!validPriorities.includes(taskPriority)) {
    res.status(400);
    throw new Error(`Invalid priority. Must be one of: ${validPriorities.join(', ')}`);
  }

  const toCreate = {
    title,
    description: description || '',
    project,
    assignee: assigneeId,
    status: taskStatus,
    priority: taskPriority,
    dueDate: dueDate || null
  };

  const task = await Task.create(toCreate);

  const populated = await Task.findById(task._id)
    .populate('assignee', 'name email')
    .populate('project', 'title owner members')
    .lean();

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

  emitToProject(req, populated.project._id, 'taskCreated', populated);

  res.status(201).json(populated);
});


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


exports.updateTask = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) { res.status(400); throw new Error('Invalid task id'); }

  const task = await Task.findById(id).populate('project', 'title owner members').populate('assignee', 'name email');
  if (!task) { res.status(404); throw new Error('Task not found'); }

  const isAssignee = task.assignee && task.assignee._id ? task.assignee._id.equals(req.user._id) : (task.assignee && task.assignee.equals && task.assignee.equals(req.user._id));
  const isOwner = task.project && task.project.owner && task.project.owner.equals(req.user._id);
  const isMember = task.project && (task.project.members || []).some(m => m.equals(req.user._id));
  const canUpdate = isAssignee || isOwner || isMember || req.user.role === 'admin';
  if (!canUpdate) { res.status(403); throw new Error('Not allowed to update task'); }

  const oldStatus = task.status;
  const oldAssigneeId = task.assignee && task.assignee._id ? String(task.assignee._id) : (task.assignee ? String(task.assignee) : null);

  // Validate and update fields
  if (req.body.title !== undefined) task.title = req.body.title;
  if (req.body.description !== undefined) task.description = req.body.description;
  
  // Validate and update assignee
  if (req.body.assignee !== undefined) {
    if (req.body.assignee === null || req.body.assignee === '') {
      task.assignee = null;
    } else {
      if (!mongoose.isValidObjectId(req.body.assignee)) {
        res.status(400);
        throw new Error('Invalid assignee id format');
      }
      const assigneeUser = await User.findById(req.body.assignee);
      if (!assigneeUser) {
        res.status(404);
        throw new Error('Assignee not found');
      }
      // Verify assignee is a project member or owner
      const isMember = (task.project.members || []).some(m => m.equals(req.body.assignee)) || 
                       task.project.owner.equals(req.body.assignee);
      if (!isMember) {
        res.status(403);
        throw new Error('Assignee must be a project member or owner');
      }
      task.assignee = req.body.assignee;
    }
  }
  
  // Validate and update status
  if (req.body.status !== undefined) {
    if (!validStatuses.includes(req.body.status)) {
      res.status(400);
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }
    task.status = req.body.status;
  }
  
  // Validate and update priority
  if (req.body.priority !== undefined) {
    if (!validPriorities.includes(req.body.priority)) {
      res.status(400);
      throw new Error(`Invalid priority. Must be one of: ${validPriorities.join(', ')}`);
    }
    task.priority = req.body.priority;
  }
  
  if (req.body.dueDate !== undefined) task.dueDate = req.body.dueDate;

  await task.save();

  const populated = await Task.findById(task._id)
    .populate('assignee', 'name email')
    .populate('project', 'title owner members')
    .lean();

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

  if (req.body.status && req.body.status !== oldStatus) {
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
  emitToProject(req, populated.project._id, 'taskUpdated', populated);

  res.json(populated);
});
exports.deleteTask = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) { res.status(400); throw new Error('Invalid task id'); }

  const task = await Task.findById(id).populate('project', 'owner title');
  if (!task) { res.status(404); throw new Error('Task not found'); }

  if (!task.project || !task.project.owner) {
    res.status(404); throw new Error('Project not found');
  }

  if (!task.project.owner.equals(req.user._id) && req.user.role !== 'admin') {
    res.status(403); throw new Error('Only project owner or admin can delete tasks');
  }

  // Cascade delete: remove all comments associated with this task
  await Comment.deleteMany({ task: id });

  await task.deleteOne();

  emitToProject(req, task.project._id, 'taskDeleted', { taskId: id });

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
