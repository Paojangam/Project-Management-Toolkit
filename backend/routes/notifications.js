const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getNotifications, markRead } = require('../controllers/notificationController');

router.use(protect);
router.get('/', getNotifications);
router.put('/:id/read', markRead);

module.exports = router;
