// =============================================================
// FILE: backend/src/middleware/auth.js
// =============================================================
// Purpose:
//   JWT verification (from HttpOnly cookie) and role-based access
//   control. Every protected route goes through requireAuth and
//   optionally requireRole. Ownership checks live in controllers.
// =============================================================

'use strict';

const jwt = require('jsonwebtoken');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const User = require('../models/User');

const COOKIE_NAME = 'cm_access';

/**
 * Attaches req.user if a valid token is present. Does NOT reject
 * anonymous requests — that's for requireAuth to do.
 */
async function attachUser(req, res, next) {
  try {
    const token = req.cookies?.[COOKIE_NAME];
    if (!token) return next();

    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET);

    const user = await User.findById(payload.sub).lean();
    if (!user || user.status !== 'active') return next();

    req.user = user;
    req.userId = user._id;
    next();
  } catch (err) {
    // Invalid/expired token → treat as anonymous
    next();
  }
}

function requireAuth(req, res, next) {
  if (!req.user) return next(ApiError.unauthorized('Authentication required'));
  next();
}

/**
 * @param {...string} roles allowed roles
 */
function requireRole(...roles) {
  return function (req, res, next) {
    if (!req.user) return next(ApiError.unauthorized('Authentication required'));
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden('Insufficient permissions'));
    }
    next();
  };
}

module.exports = {
  COOKIE_NAME,
  attachUser,
  requireAuth,
  requireRole,
};

// =============================================================
// END OF FILE: backend/src/middleware/auth.js
// =============================================================