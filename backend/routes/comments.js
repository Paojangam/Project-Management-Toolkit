const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { createComment, getComments, deleteComment } = require('../controllers/commentController');

router.use(protect);

router.post('/', createComment);
router.get('/', getComments);
router.delete('/:id', deleteComment);

module.exports = router;
