const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const fs = require('fs');

router.post('/task/:taskId', protect, upload.single('file'), async (req, res, next) => {
  // basic: return file info, in real app store path in Task.attachments array
  if (!req.file) return res.status(400).json({ message: 'No file' });
  res.json({ filename: req.file.filename, path: req.file.path, originalname: req.file.originalname });
});

module.exports = router;
