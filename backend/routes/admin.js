const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/only-admins', protect, authorize('admin'), (req, res) => {
  res.json({ secret: 'only admins see this' });
});

module.exports = router;
