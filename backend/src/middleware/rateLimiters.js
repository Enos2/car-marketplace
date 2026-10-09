// =============================================================
// FILE: backend/src/middleware/rateLimiters.js
// =============================================================
// Purpose:
//   Per-route rate limits. authLimiter is now keyed on IP and
//   capped tighter than before.
// =============================================================

'use strict';

const rateLimit = require('express-rate-limit');

const base = {
  standardHeaders: true,
  legacyHeaders: false,
};

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many attempts. Try again later.' },
  ...base,
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 60,
  message: { error: 'Upload limit reached.' },
  ...base,
});

const inquiryLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 15,
  message: { error: 'Too many enquiries.' },
  ...base,
});

const bookingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { error: 'Too many booking attempts.' },
  ...base,
});

const markViewedLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  message: { error: 'Too many requests.' },
  ...base,
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