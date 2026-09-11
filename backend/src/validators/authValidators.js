// =============================================================
// FILE: backend/src/validators/authValidators.js
// =============================================================
// Purpose:
//   express-validator chains for auth routes.
// =============================================================

'use strict';

const { body } = require('express-validator');

const registerRules = [
  body('name').isString().trim().isLength({ min: 2, max: 120 }),
  body('email').isEmail().normalizeEmail(),
  body('password').isString().isLength({ min: 8, max: 128 }),
  body('role').optional().isIn(['buyer', 'seller']), // admin cannot self-register
  body('phone').optional().isString().trim().isLength({ max: 32 }),
];

const loginRules = [
  body('email').isEmail().normalizeEmail(),
  body('password').isString().isLength({ min: 1, max: 128 }),
];

module.exports = { registerRules, loginRules };

// =============================================================
// END OF FILE: backend/src/validators/authValidators.js
// =============================================================