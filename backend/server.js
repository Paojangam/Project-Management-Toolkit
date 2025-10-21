require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
const errorHandler = require('./middleware/errorMiddleware');

connectDB();

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/admin', require('./routes/admin'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/notifications', require('./routes/notifications'));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/uploads', require('./routes/uploads'));

// ensure uploads folder exists
const fs = require('fs');
if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');


// error handler (must be last)
app.use(errorHandler);

// server.js (only the bottom part; keep your require('dotenv').config() and app setup above)
const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*' // restrict in prod to your frontend origin
  }
});

// attach io for controllers to use via req.app.get('io')
app.set('io', io);

// basic socket handlers
io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  // join rooms by user id so we can emit user-specific events
  socket.on('join', (userId) => {
    socket.join(`user:${userId}`);
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

