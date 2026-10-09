// =============================================================
// FILE: backend/src/validators/authValidators.js
// =============================================================
// Purpose:
//   Auth validation with stronger password rules.
// =============================================================

'use strict';

const { body } = require('express-validator');

const PASSWORD_MIN = 10;

const strongPassword = body('password')
  .isString()
  .isLength({ min: PASSWORD_MIN, max: 128 })
  .withMessage(`Password must be at least ${PASSWORD_MIN} characters`)
  .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
  .matches(/[a-z]/).withMessage('Password must contain a lowercase letter')
  .matches(/[0-9]/).withMessage('Password must contain a number');

const registerRules = [
  body('name').isString().trim().isLength({ min: 2, max: 120 }),
  body('email').isEmail().normalizeEmail(),
  strongPassword,
  body('role').optional().isIn(['buyer', 'seller']),
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