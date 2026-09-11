// =============================================================
// FILE: backend/src/validators/savedSearchValidators.js
// =============================================================
// Purpose:
//   express-validator chains for saved-search endpoints.
// =============================================================

'use strict';

const { body, param } = require('express-validator');

const createRules = [
  body('name').isString().trim().isLength({ min: 1, max: 100 }),
  body('filters').optional().isObject(),
  body('notifyOnMatch').optional().isBoolean().toBoolean(),
];

const updateRules = [
  param('id').isMongoId(),
  body('name').optional().isString().trim().isLength({ min: 1, max: 100 }),
  body('filters').optional().isObject(),
  body('notifyOnMatch').optional().isBoolean().toBoolean(),
];

const idRule = [param('id').isMongoId()];

module.exports = { createRules, updateRules, idRule };

// =============================================================
// END OF FILE: backend/src/validators/savedSearchValidators.js
// =============================================================