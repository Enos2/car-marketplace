// =============================================================
// FILE: backend/src/middleware/validate.js
// =============================================================
// Purpose:
//   Validation runner + a shared sanitizer for defensive string
//   cleaning. Rejects reserved keys (`$`, `.`) that could leak
//   into Mongo queries.
// =============================================================

'use strict';

const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

function validate(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();
  const details = result.array().map((e) => ({ field: e.path, message: e.msg }));
  next(ApiError.badRequest('Validation failed', details));
}

/**
 * Recursively strip `$` and `.` keys from objects. Prevents NoSQL
 * operator injection through nested payloads.
 */
function sanitize(value) {
  if (Array.isArray(value)) return value.map(sanitize);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (k.startsWith('$') || k.includes('.')) continue;
      out[k] = sanitize(v);
    }
    return out;
  }
  return value;
}

function sanitizeBody(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitize(req.body);
  }
  if (req.params && typeof req.params === 'object') {
    req.params = sanitize(req.params);
  }
  next();
}

module.exports = validate;
module.exports.sanitize = sanitize;
module.exports.sanitizeBody = sanitizeBody;

// =============================================================
// END OF FILE: backend/src/middleware/validate.js
// =============================================================