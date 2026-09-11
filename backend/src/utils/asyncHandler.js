// =============================================================
// FILE: backend/src/utils/asyncHandler.js
// =============================================================
// Purpose:
//   Wraps async route handlers so rejected promises are passed
//   to Express's error handler. Without this, an unhandled
//   rejection inside an async handler crashes the process.
// =============================================================

'use strict';

function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;

// =============================================================
// END OF FILE: backend/src/utils/asyncHandler.js
// =============================================================