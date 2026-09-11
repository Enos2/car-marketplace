// =============================================================
// FILE: backend/src/services/tokenService.js
// =============================================================
// Purpose:
//   Issue and verify access tokens (JWT). Tokens are delivered
//   via HttpOnly cookies set by the auth controller. This module
//   only signs/verifies — it does not touch the request/response.
// =============================================================

'use strict';

const jwt = require('jsonwebtoken');
const env = require('../config/env');

/**
 * Sign an access token for a user.
 * @param {{ _id: string, role: string }} user
 * @returns {string} JWT
 */
function signAccessToken(user) {
  return jwt.sign(
    { sub: String(user._id), role: user.role },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRES }
  );
}

/**
 * Verify an access token. Throws on invalid/expired.
 * @param {string} token
 * @returns {object} payload
 */
function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET);
}

module.exports = { signAccessToken, verifyAccessToken };

// =============================================================
// END OF FILE: backend/src/services/tokenService.js
// =============================================================