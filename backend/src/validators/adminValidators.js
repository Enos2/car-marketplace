// =============================================================
// FILE: backend/src/validators/adminValidators.js
// =============================================================
// Purpose:
//   express-validator chains for admin moderation endpoints.
// =============================================================

'use strict';

const { body, param } = require('express-validator');

const moderateVehicleRules = [
  param('id').isMongoId(),
  body('action').isIn([
    'approve',
    'reject',
    'remove',
    'restore',
    'feature',
    'unfeature',
  ]),
  body('reason').optional().isString().trim().isLength({ max: 500 }),
];

const userStatusRules = [
  param('id').isMongoId(),
  body('status').isIn(['active', 'suspended']),
  body('reason').optional().isString().trim().isLength({ max: 500 }),
];

module.exports = { moderateVehicleRules, userStatusRules };

// =============================================================
// END OF FILE: backend/src/validators/adminValidators.js
// =============================================================