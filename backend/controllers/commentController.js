const asyncHandler = require('express-async-handler');
const Comment = require('../models/Comment');
const Task = require('../models/Task');

// POST /api/comments
exports.createComment = asyncHandler(async (req, res) => {
  const { taskId, text } = req.body;
  if (!taskId || !text) { res.status(400); throw new Error('taskId and text required'); }

  const task = await Task.findById(taskId).populate('project', 'owner members');
  if (!task) { res.status(404); throw new Error('Task not found'); }

  // user must belong to project or be admin
  const p = task.project;
  const isRelated = p.owner.equals(req.user._id) || p.members.some(m => m.equals(req.user._id)) || req.user.role === 'admin';
  if (!isRelated) { res.status(403); throw new Error('Forbidden'); }

  const comment = await Comment.create({ task: taskId, author: req.user._id, text });
  const populated = await comment.populate('author', 'name email').execPopulate();
  res.status(201).json(populated);
});

// GET /api/comments?task=<taskId>
exports.getComments = asyncHandler(async (req, res) => {
  const { task } = req.query;
  if (!task) { res.status(400); throw new Error('task query param required'); }

  const comments = await Comment.find({ task }).populate('author', 'name email').sort({ createdAt: 1 });
  res.json(comments);
});
