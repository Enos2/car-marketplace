// =============================================================
// FILE: backend/src/middleware/notFound.js
// =============================================================
// Purpose:
//   Catches unmatched routes and passes a 404 ApiError forward.
//   Registered after all routers.
// =============================================================

'use strict';

const ApiError = require('../utils/ApiError');

function notFound(req, res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

module.exports = notFound;

// =============================================================
// END OF FILE: backend/src/middleware/notFound.js
// =============================================================