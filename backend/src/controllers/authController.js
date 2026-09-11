// =============================================================
// FILE: backend/src/controllers/authController.js
// =============================================================
// Purpose:
//   Register, login, logout, current user. Sets and clears an
//   HttpOnly cookie for the access token. Never returns the
//   password hash. Uses generic error messages on login to
//   reduce account enumeration (spec §16).
// =============================================================

'use strict';

const User = require('../models/User');
const SellerProfile = require('../models/SellerProfile');
const AuditLog = require('../models/AuditLog');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { signAccessToken } = require('../services/tokenService');
const env = require('../config/env');
const { COOKIE_NAME } = require('../middleware/auth');

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: env.isProd,
  path: '/',
  maxAge: 15 * 60 * 1000, // matches JWT_ACCESS_EXPIRES=15m
};

const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone } = req.body;

  const existing = await User.findOne({ email }).lean();
  if (existing) throw ApiError.conflict('Email already registered');

  const user = await User.create({
    name,
    email,
    phone: phone || '',
    role: role === 'seller' ? 'seller' : 'buyer',
    passwordHash: password, // hashed by pre-save hook
  });

  // Every seller gets a profile scaffold
  if (user.role === 'seller') {
    await SellerProfile.create({ user: user._id });
  }

  const token = signAccessToken(user);
  res.cookie(COOKIE_NAME, token, COOKIE_OPTS);

  await AuditLog.create({
    actor: user._id,
    action: 'auth.register',
    targetType: 'user',
    targetId: user._id,
    ip: req.ip,
    userAgent: req.get('user-agent') || '',
  });

  res.status(201).json({ user: user.toJSON() });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user) throw ApiError.unauthorized('Invalid credentials');
  if (user.status !== 'active') throw ApiError.forbidden('Account suspended');

  const ok = await user.verifyPassword(password);
  if (!ok) throw ApiError.unauthorized('Invalid credentials');

  user.lastLoginAt = new Date();
  await user.save();

  const token = signAccessToken(user);
  res.cookie(COOKIE_NAME, token, COOKIE_OPTS);

  res.json({ user: user.toJSON() });
});

const logout = asyncHandler(async (req, res) => {
  res.clearCookie(COOKIE_NAME, { ...COOKIE_OPTS, maxAge: 0 });
  res.json({ ok: true });
});

const me = asyncHandler(async (req, res) => {
  if (!req.user) return res.json({ user: null });
  res.json({ user: req.user });
});

module.exports = { register, login, logout, me };

// =============================================================
// END OF FILE: backend/src/controllers/authController.js
// =============================================================