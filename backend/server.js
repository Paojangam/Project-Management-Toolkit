require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
const errorHandler = require('./middleware/errorMiddleware');

connectDB();

const app = express();

// CORS configuration for production and development
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? (process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',').map(url => url.trim()) : [])
  : ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:5173', 'http://127.0.0.1:3000'];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, or server-to-server)
    if (!origin) return callback(null, true);
    
    // In development, allow all origins
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    
    // In production, check against allowed origins
    if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use('/api/admin', require('./routes/admin'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/notifications', require('./routes/notifications'));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/uploads', require('./routes/uploads'));

// Health check endpoint for deployment platforms
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Project Management API', 
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// ensure uploads folder exists
const fs = require('fs');
if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');


// error handler (must be last)
app.use(errorHandler);

// server.js (only the bottom part; keep your require('dotenv').config() and app setup above)
const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer(app);

// Socket.IO CORS configuration
const socketCorsOrigins = process.env.NODE_ENV === 'production'
  ? (process.env.FRONTEND_URL 
      ? process.env.FRONTEND_URL.split(',').map(url => url.trim()).filter(Boolean)
      : [])
  : ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:5173', 'http://127.0.0.1:3000'];

const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? (socketCorsOrigins.length > 0 ? socketCorsOrigins : false)
      : '*',
    methods: ['GET', 'POST'],
    credentials: true
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
const HOST = process.env.HOST || '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on ${HOST}:${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  if (process.env.NODE_ENV === 'production') {
    console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'Not set'}`);
  }
});

