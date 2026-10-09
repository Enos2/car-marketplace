// =============================================================
// FILE: backend/src/controllers/authController.js
// =============================================================
// Purpose:
//   Auth flows with account lockout after repeated failures.
//   Generic error messages to avoid account enumeration.
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

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.isProd,
    path: '/',
    maxAge: 15 * 60 * 1000,
  };
}

const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone } = req.body;

  const existing = await User.findOne({ email }).lean();
  if (existing) throw ApiError.conflict('Email already registered');

  const user = await User.create({
    name,
    email,
    phone: phone || '',
    role: role === 'seller' ? 'seller' : 'buyer',
    passwordHash: password,
  });

  if (user.role === 'seller') {
    await SellerProfile.create({ user: user._id });
  }

  const token = signAccessToken(user);
  res.cookie(COOKIE_NAME, token, cookieOptions());

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

  // Locked accounts respond identically to bad passwords (no info leak).
  if (user.isLocked()) {
    await AuditLog.create({
      actor: user._id,
      action: 'auth.login.locked',
      targetType: 'user',
      targetId: user._id,
      ip: req.ip,
      userAgent: req.get('user-agent') || '',
    });
    throw ApiError.unauthorized('Invalid credentials');
  }

  const ok = await user.verifyPassword(password);
  if (!ok) {
    user.registerFailedLogin();
    await user.save();
    await AuditLog.create({
      actor: user._id,
      action: 'auth.login.failed',
      targetType: 'user',
      targetId: user._id,
      ip: req.ip,
      userAgent: req.get('user-agent') || '',
      metadata: { failedAttempts: user.failedLoginAttempts },
    });
    throw ApiError.unauthorized('Invalid credentials');
  }

  if (user.status !== 'active') {
    throw ApiError.forbidden('Account suspended');
  }

  user.lastLoginAt = new Date();
  user.clearFailedLogins();
  await user.save();

  const token = signAccessToken(user);
  res.cookie(COOKIE_NAME, token, cookieOptions());

  await AuditLog.create({
    actor: user._id,
    action: 'auth.login.success',
    targetType: 'user',
    targetId: user._id,
    ip: req.ip,
    userAgent: req.get('user-agent') || '',
  });

  res.json({ user: user.toJSON() });
});

const logout = asyncHandler(async (req, res) => {
  res.clearCookie(COOKIE_NAME, { ...cookieOptions(), maxAge: 0 });
  res.json({ ok: true });
});

const me = asyncHandler(async (req, res) => {
  res.json({ user: req.user || null });
});

module.exports = { register, login, logout, me };

// =============================================================
// END OF FILE: backend/src/controllers/authController.js
// =============================================================