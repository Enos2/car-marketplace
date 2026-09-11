// =============================================================
// FILE: backend/src/validators/reportValidators.js
// =============================================================
// Purpose:
//   express-validator chains for report creation and resolution.
// =============================================================

'use strict';

const { body } = require('express-validator');
const Report = require('../models/Report');

const createRules = [
  body('targetType').isIn(['vehicle', 'user']),
  body('targetId').isMongoId(),
  body('reason').isIn(Report.REASONS),
  body('details').optional().isString().trim().isLength({ max: 2000 }),
];

const resolveRules = [
  body('status').isIn(['reviewing', 'resolved', 'dismissed']),
  body('notes').optional().isString().trim().isLength({ max: 2000 }),
];

module.exports = { createRules, resolveRules };

// =============================================================
// END OF FILE: backend/src/validators/reportValidators.js
// =============================================================