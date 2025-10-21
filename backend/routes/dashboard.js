const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { overview, calendar, stats } = require('../controllers/dashboardController');

// attach protect: all dashboard routes require auth
router.use(protect);

router.get('/overview', overview);

// calendar (by project and date range)
router.get('/calendar', async (req, res, next) => {
  // fallback to controller inline to keep things short
  try {
    const { project, from, to } = req.query;
    const filter = {};
    if (project) filter.project = project;
    if (from || to) filter.dueDate = {};
    if (from) filter.dueDate.$gte = new Date(from);
    if (to) filter.dueDate.$lte = new Date(to);
    // ensure user has access: project in their projects or tasks assigned to them
    const tasks = await require('../models/Task').find(filter)
      .populate('project','title')
      .populate('assignee','name email').lean();
    res.json(tasks);
  } catch (err) { next(err); }
});

router.get('/stats', async (req, res, next) => {
  try {
    const userId = req.user._id;
    const totalTasks = await require('../models/Task').countDocuments({ project: { $in: await getUserProjectIds(userId) } });
    const done = await require('../models/Task').countDocuments({ status: 'done', project: { $in: await getUserProjectIds(userId) } });
    const percent = totalTasks === 0 ? 0 : Math.round((done/totalTasks)*100);
    res.json({ totalTasks, done, percent });
  } catch (err) { next(err); }
});

async function getUserProjectIds(userId){
  const projects = await require('../models/Project').find({ $or: [{ owner: userId }, { members: userId }] }).select('_id');
  return projects.map(p=>p._id);
}

module.exports = router;
