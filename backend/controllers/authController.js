const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
};

exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Please provide name, email and password');
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('User with that email already exists');
  }

  const user = await User.create({ name, email, password, role });
  res.status(201).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    token: generateToken(user._id)
  });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400);
    throw new Error('Please provide email and password');
  }

  const user = await User.findOne({ email });
  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id)
    });
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  res.json(user);
});

// ==================== GOOGLE LOGIN ====================
exports.googleLogin = asyncHandler(async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ ok: false, message: 'Google token is required' });

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    console.log('Google payload:', payload);

    if (!payload || !payload.email) {
      return res.status(400).json({ ok: false, message: 'Google payload missing email' });
    }

    const { sub: googleId, email, name: googleName, picture, email_verified } = payload;

    // Prepare safe defaults to satisfy strict schemas
    const fallbackName = googleName || email.split('@')[0];
    const randomPassword = Math.random().toString(36).slice(-12); // secure enough for generated password
    const defaultRole = 'user';

    // Try to find existing user by email first
    let user = await User.findOne({ email });

    if (user) {
      // If user exists but doesn't have googleId stored, attach it
      if (!user.googleId || user.googleId !== googleId) {
        user.googleId = googleId;
        if (picture && !user.picture) user.picture = picture;
        await user.save();
      }
    } else {
      // Use upsert to avoid race conditions and validation issues:
      user = await User.findOneAndUpdate(
        { email },
        {
          $setOnInsert: {
            name: fallbackName,
            email,
            password: randomPassword,
            role: defaultRole,
            googleId,
            picture,
            emailVerified: !!email_verified
          }
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true
        }
      );
    }

    // Final safety: ensure we have a user document
    if (!user) {
      return res.status(500).json({ ok: false, message: 'Failed to find or create user' });
    }

    return res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id)
    });
  } catch (error) {
    console.error('Google login error:', error);
    // Expose error.message temporarily while debugging; remove or sanitize in prod
    return res.status(401).json({ ok: false, message: 'Google authentication failed', error: error.message });
  }
});
