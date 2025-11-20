const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Project = require('../models/Project');
const Task = require('../models/Task'); // For cascade deletion
const User = require('../models/User');

exports.getProjects = asyncHandler(async (req, res) => {
  const projects = await Project.find({
    $or: [{ owner: req.user._id }, { members: req.user._id }]
  }).populate('owner', 'name email').populate('members', 'name email');
  res.json(projects);
});

exports.createProject = asyncHandler(async (req, res) => {
  const { title, description, startDate, endDate, members } = req.body;
  if (!title) { res.status(400); throw new Error('Title required'); }

  // Validate members array if provided
  if (members && Array.isArray(members)) {
    for (const memberId of members) {
      if (!mongoose.isValidObjectId(memberId)) {
        res.status(400);
        throw new Error(`Invalid member id format: ${memberId}`);
      }
    }
    // Verify all member IDs exist
    const validUsers = await User.find({ _id: { $in: members } });
    if (validUsers.length !== members.length) {
      res.status(400);
      throw new Error('Some member IDs are invalid or do not exist');
    }
  }

  const project = await Project.create({
    title,
    description,
    startDate,
    endDate,
    owner: req.user._id,
    members: members || []
  });

  res.status(201).json(project);
});

exports.getProjectById = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400);
    throw new Error('Invalid project id format');
  }

  const project = await Project.findById(req.params.id)
    .populate('owner', 'name email')
    .populate('members', 'name email');

  if (!project) { res.status(404); throw new Error('Project not found'); }

  const isRelated = project.owner._id.equals(req.user._id) ||
    project.members.some(m => m._id.equals(req.user._id));
  if (!isRelated) { res.status(403); throw new Error('Forbidden'); }

  res.json(project);
});

exports.updateProject = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400);
    throw new Error('Invalid project id format');
  }

  const project = await Project.findById(req.params.id);
  if (!project) { res.status(404); throw new Error('Project not found'); }

  if (!project.owner.equals(req.user._id) && req.user.role !== 'admin') {
    res.status(403); throw new Error('Only owner or admin can update project');
  }

  const { title, description, startDate, endDate, members, status } = req.body;
  if (title !== undefined) project.title = title;
  if (description !== undefined) project.description = description;
  if (startDate !== undefined) project.startDate = startDate;
  if (endDate !== undefined) project.endDate = endDate;
  
  // Validate members array if provided
  if (members !== undefined) {
    if (!Array.isArray(members)) {
      res.status(400);
      throw new Error('Members must be an array');
    }
    for (const memberId of members) {
      if (!mongoose.isValidObjectId(memberId)) {
        res.status(400);
        throw new Error(`Invalid member id format: ${memberId}`);
      }
    }
    // Verify all member IDs exist
    const validUsers = await User.find({ _id: { $in: members } });
    if (validUsers.length !== members.length) {
      res.status(400);
      throw new Error('Some member IDs are invalid or do not exist');
    }
    project.members = members;
  }
  
  if (status !== undefined) project.status = status;

  await project.save();
  res.json(project);
});

exports.deleteProject = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400);
    throw new Error('Invalid project id format');
  }

  const project = await Project.findById(req.params.id);
  if (!project) { res.status(404); throw new Error('Project not found'); }
  if (!project.owner.equals(req.user._id) && req.user.role !== 'admin') {
    res.status(403); throw new Error('Only owner or admin can delete project');
  }

  // Remove all tasks related to this project (cascade delete)
  await Task.deleteMany({ project: project._id });

  await project.deleteOne();

  res.json({ message: 'Project removed (and associated tasks deleted)' });
});
