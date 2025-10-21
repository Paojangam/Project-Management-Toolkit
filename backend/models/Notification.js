const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // target user
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // who triggered it
  type: { type: String, required: true }, // e.g., 'task_assigned', 'task_updated', 'deadline_near'
  title: { type: String, required: true },
  body: { type: String },
  link: { type: String }, // optional path the frontend can open (e.g., /projects/:id/tasks/:id)
  read: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
