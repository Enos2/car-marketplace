// =============================================================
// FILE: backend/src/middleware/validate.js
// =============================================================
// Purpose:
//   Runs express-validator chains and collapses errors into a
//   single 400 response with field-level details. Prevents bad
//   data reaching controllers (spec §17).
// =============================================================

'use strict';

const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

function validate(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const details = result.array().map((e) => ({
    field: e.path,
    message: e.msg,
  }));

  next(ApiError.badRequest('Validation failed', details));
}

module.exports = validate;

// =============================================================
// END OF FILE: backend/src/middleware/validate.js
// =============================================================