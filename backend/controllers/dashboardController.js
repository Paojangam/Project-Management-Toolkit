const asyncHandler = require('express-async-handler');
const Project = require('../models/Project');
const Task = require('../models/Task');
const mongoose = require('mongoose');

// GET /api/dashboard/overview
exports.overview = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // projects the user is part of or owner
  const projects = await Project.find({
    $or: [{ owner: userId }, { members: userId }]
  }).select('title startDate endDate status').lean();

  // tasks assigned to user and task counts by status
  const assignedTasks = await Task.find({ assignee: userId }).select('title status dueDate project').populate('project','title').lean();

  const statusCounts = assignedTasks.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {});

  // upcoming deadlines within next 7 days
  const now = new Date();
  const week = new Date(Date.now() + 7*24*60*60*1000);
  const upcoming = await Task.find({
    dueDate: { $gte: now, $lte: week },
    $or: [{ assignee: userId }, { project: { $in: projects.map(p => p._id) } }]
  }).select('title dueDate status project').populate('project','title').lean();

  res.json({ projects, assignedTasks, statusCounts, upcoming });
});
// simple report for a project
exports.projectReport = asyncHandler(async (req, res) => {
  const { projectId } = req.query;
  if (!projectId) { res.status(400); throw new Error('projectId required'); }
  const total = await Task.countDocuments({ project: projectId });
  const byStatus = await Task.aggregate([
    { $match: { project: mongoose.Types.ObjectId(projectId) } },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);
  const completed = byStatus.find(b => b._id === 'done')?.count || 0;
  const percent = total === 0 ? 0 : Math.round((completed/total)*100);
  res.json({ total, byStatus, completed, percent });
});

