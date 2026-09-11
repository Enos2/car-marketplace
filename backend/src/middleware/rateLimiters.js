// =============================================================
// FILE: backend/src/middleware/rateLimiters.js
// =============================================================
// Purpose:
//   Per-route rate limiters (spec §17). Stricter than the global
//   limit for auth, uploads, enquiries, and bookings.
// =============================================================

'use strict';

const rateLimit = require('express-rate-limit');

const standard = {
  standardHeaders: true,
  legacyHeaders: false,
};

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many attempts. Try again later.' },
  ...standard,
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 60,
  message: { error: 'Upload limit reached. Try again later.' },
  ...standard,
});

const inquiryLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 15,
  message: { error: 'Too many enquiries. Try again later.' },
  ...standard,
});

const bookingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { error: 'Too many booking attempts. Try again later.' },
  ...standard,
});

const markViewedLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  message: { error: 'Too many requests. Slow down.' },
  ...standard,
});

module.exports = {
  authLimiter,
  uploadLimiter,
  inquiryLimiter,
  bookingLimiter,
  markViewedLimiter,
};

// =============================================================
// END OF FILE: backend/src/middleware/rateLimiters.js
// =============================================================