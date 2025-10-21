const asyncHandler = require('express-async-handler');
const Notification = require('../models/Notification');

// GET /api/notifications
exports.getNotifications = asyncHandler(async (req, res) => {
  const notifs = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50).lean();
  res.json(notifs);
});

// PUT /api/notifications/:id/read  (mark as read)
exports.markRead = asyncHandler(async (req, res) => {
  const n = await Notification.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { read: true }, { new: true });
  if (!n) { res.status(404); throw new Error('Notification not found'); }
  res.json(n);
});
