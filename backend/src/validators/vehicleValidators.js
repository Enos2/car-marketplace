// =============================================================
// FILE: backend/src/validators/vehicleValidators.js
// =============================================================
// Purpose:
//   express-validator chains for vehicle create/update.
// =============================================================

'use strict';

const { body, param } = require('express-validator');
const Vehicle = require('../models/Vehicle');

const createRules = [
  body('make').isString().trim().isLength({ min: 1, max: 80 }),
  body('model').isString().trim().isLength({ min: 1, max: 80 }),
  body('trim').optional().isString().trim().isLength({ max: 80 }),
  body('year').isInt({ min: 1950, max: new Date().getFullYear() + 1 }).toInt(),
  body('priceAmount').isInt({ min: 0 }).toInt(),
  body('priceCurrency').isIn(['KES', 'USD']),
  body('negotiable').optional().isBoolean().toBoolean(),
  body('mileage').isInt({ min: 0 }).toInt(),
  body('mileageUnit').optional().isIn(['km', 'mi']),
  body('condition').optional().isIn(Vehicle.CONDITION),
  body('bodyType').optional().isIn(Vehicle.BODY_TYPE),
  body('fuelType').optional().isIn(Vehicle.FUEL_TYPE),
  body('transmission').optional().isIn(Vehicle.TRANSMISSION),
  body('location').optional().isObject(),
  body('location.country').optional().isString().trim().isLength({ max: 80 }),
  body('location.county').optional().isString().trim().isLength({ max: 80 }),
  body('location.city').optional().isString().trim().isLength({ max: 80 }),
  body('description').optional().isString().trim().isLength({ max: 5000 }),
  body('features').optional().isArray({ max: 50 }),
  body('features.*').optional().isString().trim().isLength({ max: 80 }),
];

const updateRules = [
  param('id').isMongoId(),
  // All fields optional on update
  body('make').optional().isString().trim().isLength({ min: 1, max: 80 }),
  body('model').optional().isString().trim().isLength({ min: 1, max: 80 }),
  body('trim').optional().isString().trim().isLength({ max: 80 }),
  body('year').optional().isInt({ min: 1950, max: new Date().getFullYear() + 1 }).toInt(),
  body('priceAmount').optional().isInt({ min: 0 }).toInt(),
  body('priceCurrency').optional().isIn(['KES', 'USD']),
  body('negotiable').optional().isBoolean().toBoolean(),
  body('mileage').optional().isInt({ min: 0 }).toInt(),
  body('mileageUnit').optional().isIn(['km', 'mi']),
  body('condition').optional().isIn(Vehicle.CONDITION),
  body('bodyType').optional().isIn(Vehicle.BODY_TYPE),
  body('fuelType').optional().isIn(Vehicle.FUEL_TYPE),
  body('transmission').optional().isIn(Vehicle.TRANSMISSION),
  body('location').optional().isObject(),
  body('location.country').optional().isString().trim().isLength({ max: 80 }),
  body('location.county').optional().isString().trim().isLength({ max: 80 }),
  body('location.city').optional().isString().trim().isLength({ max: 80 }),
  body('description').optional().isString().trim().isLength({ max: 5000 }),
  body('features').optional().isArray({ max: 50 }),
  body('features.*').optional().isString().trim().isLength({ max: 80 }),
];

const idRule = [param('id').isMongoId()];

module.exports = { createRules, updateRules, idRule };

// =============================================================
// END OF FILE: backend/src/validators/vehicleValidators.js
// =============================================================