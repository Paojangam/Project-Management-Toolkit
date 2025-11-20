const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Comment = require('../models/Comment');
const Task = require('../models/Task');

exports.createComment = asyncHandler(async (req, res) => {
  const { taskId, text } = req.body;
  if (!taskId || !text) { res.status(400); throw new Error('taskId and text required'); }

  if (!mongoose.isValidObjectId(taskId)) {
    res.status(400);
    throw new Error('Invalid task id format');
  }

  const task = await Task.findById(taskId).populate('project', 'owner members');
  if (!task) { res.status(404); throw new Error('Task not found'); }

  const p = task.project;
  const isRelated = p.owner.equals(req.user._id) || p.members.some(m => m.equals(req.user._id)) || req.user.role === 'admin';
  if (!isRelated) { res.status(403); throw new Error('Forbidden'); }

  const comment = await Comment.create({ task: taskId, author: req.user._id, text });
  await comment.populate('author', 'name email');
  res.status(201).json(comment);
});

exports.getComments = asyncHandler(async (req, res) => {
  const { task } = req.query;
  if (!task) { res.status(400); throw new Error('task query param required'); }

  if (!mongoose.isValidObjectId(task)) {
    res.status(400);
    throw new Error('Invalid task id format');
  }

  // Verify task exists
  const taskExists = await Task.findById(task);
  if (!taskExists) { res.status(404); throw new Error('Task not found'); }

  const comments = await Comment.find({ task }).populate('author', 'name email').sort({ createdAt: 1 });
  res.json(comments);
});

exports.deleteComment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  if (!mongoose.isValidObjectId(id)) {
    res.status(400);
    throw new Error('Invalid comment id format');
  }
  
  const comment = await Comment.findById(id).populate({
    path: 'task',
    populate: { path: 'project', select: 'owner members' },
  });
  if (!comment) { res.status(404); throw new Error('Comment not found'); }

  const userId = req.user._id;
  const isAuthor = comment.author.equals(userId);
  const isAdmin = req.user.role === 'admin';

  // Allow project owner to delete, too
  let isProjectOwner = false;
  if (comment.task && comment.task.project && comment.task.project.owner) {
    isProjectOwner = comment.task.project.owner.equals(userId);
  }

  if (!isAuthor && !isProjectOwner && !isAdmin) {
    res.status(403); throw new Error('Not allowed to delete comment');
  }

  await comment.deleteOne();
  res.json({ message: 'Comment deleted' });
});
