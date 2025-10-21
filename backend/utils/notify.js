const Notification = require('../models/Notification');

async function notify({ req, userId, actorId, type, title, body, link }){
  // create DB record
  const n = await Notification.create({ user: userId, actor: actorId, type, title, body, link });
  // emit via socket to user room
  try {
    const io = req.app.get('io');
    if (io) io.to(`user:${userId}`).emit('notification', n);
  } catch(err){
    console.error('notify emit failed', err);
  }
  return n;
}
module.exports = notify;
