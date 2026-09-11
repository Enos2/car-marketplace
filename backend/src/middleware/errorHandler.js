// =============================================================
// FILE: backend/src/middleware/errorHandler.js
// =============================================================
// Purpose:
//   Centralized error handler. Converts known error shapes
//   (ApiError, Mongoose, JWT) into safe JSON responses. Never
//   leaks stack traces or internals in production (spec §17).
// =============================================================

'use strict';

const env = require('../config/env');
const logger = require('../utils/logger');

function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  let status = err.status || 500;
  let message = err.message || 'Server error';
  let details = err.details;

  // Mongoose validation
  if (err.name === 'ValidationError') {
    status = 400;
    message = 'Validation failed';
    details = Object.values(err.errors || {}).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    status = 400;
    message = 'Invalid identifier';
  }

  // Mongo duplicate key
  if (err.code === 11000) {
    status = 409;
    message = 'Duplicate resource';
    details = err.keyValue;
  }

  // JWT errors should normally be caught before here, but be safe.
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    status = 401;
    message = 'Invalid or expired token';
  }

  if (status >= 500) {
    logger.error('Unhandled request error', {
      message: err.message,
      stack: env.isDev ? err.stack : undefined,
      path: req.originalUrl,
      method: req.method,
    });
  }

  const body = { error: message };
  if (details) body.details = details;
  if (env.isDev && status >= 500) body.stack = err.stack;

  res.status(status).json(body);
}

module.exports = errorHandler;

// =============================================================
// END OF FILE: backend/src/middleware/errorHandler.js
// =============================================================