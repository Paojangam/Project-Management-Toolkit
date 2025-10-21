// backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

exports.protect = asyncHandler(async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    console.log('authHeader raw:', authHeader);

    if (!authHeader) {
      res.status(401);
      throw new Error('Not authorized, token missing');
    }

    // tolerate "Bearer token" or "bearer token" or extra spaces
    const parts = authHeader.split(' ').filter(Boolean);
    if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
      res.status(401);
      throw new Error('Not authorized, bad authorization format');
    }

    const token = parts[1];
    if (!token) {
      res.status(401);
      throw new Error('Not authorized, token missing after Bearer');
    }

    if (!process.env.JWT_SECRET) {
      console.error('Missing JWT_SECRET env var');
      res.status(500);
      throw new Error('Server misconfigured: missing JWT secret');
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      console.error('JWT verify failed:', err);
      res.status(401);
      throw new Error('Not authorized, token failed');
    }

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      res.status(401);
      throw new Error('User not found');
    }

    req.user = user;
    next();
  } catch (err) {
    // let the error middleware send JSON; just rethrow
    throw err;
  }
});
