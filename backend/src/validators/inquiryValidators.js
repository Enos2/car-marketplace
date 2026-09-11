// =============================================================
// FILE: backend/src/validators/inquiryValidators.js
// =============================================================
// Purpose:
//   express-validator chains for buyer enquiries.
// =============================================================

'use strict';

const { body, param } = require('express-validator');

const createRules = [
  param('vehicleId').isMongoId(),
  body('name').isString().trim().isLength({ min: 2, max: 120 }),
  body('email').isEmail().normalizeEmail(),
  body('phone').optional().isString().trim().isLength({ max: 32 }),
  body('preferredContact').optional().isIn(['email', 'phone', 'whatsapp', 'any']),
  body('message').isString().trim().isLength({ min: 10, max: 2000 }),
];

const updateStatusRules = [
  param('id').isMongoId(),
  body('status').isIn(['new', 'contacted', 'in-progress', 'closed']),
  body('sellerNotes').optional().isString().trim().isLength({ max: 2000 }),
];

module.exports = { createRules, updateStatusRules };

// =============================================================
// END OF FILE: backend/src/validators/inquiryValidators.js
// =============================================================