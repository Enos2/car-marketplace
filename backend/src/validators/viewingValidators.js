// =============================================================
// FILE: backend/src/validators/viewingValidators.js
// =============================================================
// Purpose:
//   express-validator chains for the buyer, seller, and admin
//   viewing endpoints.
// =============================================================

'use strict';

const { body, param, query } = require('express-validator');

// ---- buyer ---------------------------------------------------
const createViewingRules = [
  param('id').isMongoId(),
  body('date')
    .isString()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('date must be YYYY-MM-DD'),
  body('startTime')
    .isString()
    .matches(/^\d{2}:\d{2}$/)
    .withMessage('startTime must be HH:mm'),
  body('name').optional().isString().trim().isLength({ min: 2, max: 120 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().isString().trim().isLength({ max: 32 }),
  body('preferredContact')
    .optional()
    .isIn(['email', 'phone', 'whatsapp', 'any']),
  body('note').optional().isString().trim().isLength({ max: 1000 }),
];

const slotQueryRules = [
  param('id').isMongoId(),
  query('date')
    .isString()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('date must be YYYY-MM-DD'),
];

const viewingIdRule = [param('id').isMongoId()];

const cancelViewingRules = [
  param('id').isMongoId(),
  body('reason').optional().isString().trim().isLength({ max: 500 }),
];

// ---- seller --------------------------------------------------
const availabilityRules = [
  body('days').isArray({ min: 1, max: 7 }),
  body('days.*').isInt({ min: 0, max: 6 }).toInt(),
  body('windows').isArray({ min: 1, max: 8 }),
  body('windows.*.start').matches(/^\d{2}:\d{2}$/),
  body('windows.*.end').matches(/^\d{2}:\d{2}$/),
  body('slotMinutes').optional().isInt({ min: 15, max: 480 }).toInt(),
  body('location').optional().isString().trim().isLength({ max: 300 }),
  body('feeMinor').optional().isInt({ min: 0 }).toInt(),
  body('feeCurrency').optional().isIn(['KES', 'USD']),
];

// ---- admin ---------------------------------------------------
const adminListRules = [
  query('receiptStatus')
    .optional()
    .isIn(['pending', 'viewed', 'postponed', 'rescheduled']),
  query('bookingStatus').optional().isString().trim().isLength({ max: 40 }),
  query('vehicleId').optional().isMongoId(),
  query('buyerId').optional().isMongoId(),
  query('sellerId').optional().isMongoId(),
  query('date').optional().matches(/^\d{4}-\d{2}-\d{2}$/),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
];

const adminRescheduleRules = [
  param('id').isMongoId(),
  body('date').isString().matches(/^\d{4}-\d{2}-\d{2}$/),
  body('startTime').isString().matches(/^\d{2}:\d{2}$/),
  body('endTime').isString().matches(/^\d{2}:\d{2}$/),
  body('location').optional().isString().trim().isLength({ max: 300 }),
  body('reason').optional().isString().trim().isLength({ max: 500 }),
];

const markViewedRules = [param('id').isMongoId()];

module.exports = {
  createViewingRules,
  slotQueryRules,
  viewingIdRule,
  cancelViewingRules,
  availabilityRules,
  adminListRules,
  adminRescheduleRules,
  markViewedRules,
};

// =============================================================
// END OF FILE: backend/src/validators/viewingValidators.js
// =============================================================