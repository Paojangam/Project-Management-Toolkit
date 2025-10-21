const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { createComment, getComments } = require('../controllers/commentController');

router.use(protect);

router.post('/', createComment);
router.get('/', getComments);

module.exports = router;
