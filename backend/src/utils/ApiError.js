// =============================================================
// FILE: backend/src/utils/ApiError.js
// =============================================================
// Purpose:
//   Typed error class for HTTP errors. Thrown anywhere in the
//   request lifecycle; caught by the centralized error handler.
//   Avoids leaking stack traces or internals to clients.
// =============================================================

'use strict';

class ApiError extends Error {
  /**
   * @param {number} status  HTTP status code
   * @param {string} message Safe, client-facing message
   * @param {object} [details] Optional field-level detail (e.g. validation)
   */
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
    this.isApiError = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(msg = 'Bad request', details) {
    return new ApiError(400, msg, details);
  }
  static unauthorized(msg = 'Unauthorized') {
    return new ApiError(401, msg);
  }
  static forbidden(msg = 'Forbidden') {
    return new ApiError(403, msg);
  }
  static notFound(msg = 'Not found') {
    return new ApiError(404, msg);
  }
  static conflict(msg = 'Conflict') {
    return new ApiError(409, msg);
  }
  static tooMany(msg = 'Too many requests') {
    return new ApiError(429, msg);
  }
  static internal(msg = 'Server error') {
    return new ApiError(500, msg);
  }
}

module.exports = ApiError;

// =============================================================
// END OF FILE: backend/src/utils/ApiError.js
// =============================================================