const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getProjects, createProject, getProjectById, updateProject, deleteProject
} = require('../controllers/projectController');

router.use(protect);

router.route('/')
  .get(getProjects)
  .post(createProject); // you could add authorize('admin','manager') if you want restriction

router.route('/:id')
  .get(getProjectById)
  .put(updateProject)
  .delete(deleteProject);

module.exports = router;
