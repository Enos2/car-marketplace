// =============================================================
// FILE: backend/src/routes/vehicleRoutes.js
// =============================================================
// Purpose:
//   Vehicle routes. Public reads, protected seller writes,
//   image upload, favorite toggle.
// =============================================================

'use strict';

const express = require('express');
const {
  listVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  submitForReview,
  uploadImages,
  deleteImage,
  toggleFavorite,
} = require('../controllers/vehicleController');
const {
  createRules,
  updateRules,
  idRule,
} = require('../validators/vehicleValidators');
const validate = require('../middleware/validate');
const { requireAuth, requireRole } = require('../middleware/auth');
const { uploadLimiter } = require('../middleware/rateLimiters');
const { uploadVehicleImages } = require('../middleware/upload');

const router = express.Router();

// ----- Public reads ------------------------------------------
router.get('/', listVehicles);
router.get('/:id', idRule, validate, getVehicleById);

// ----- Seller writes -----------------------------------------
router.post(
  '/',
  requireAuth,
  requireRole('seller', 'admin'),
  createRules,
  validate,
  createVehicle
);

router.patch(
  '/:id',
  requireAuth,
  requireRole('seller', 'admin'),
  updateRules,
  validate,
  updateVehicle
);

router.delete(
  '/:id',
  requireAuth,
  requireRole('seller', 'admin'),
  idRule,
  validate,
  deleteVehicle
);

router.post(
  '/:id/submit',
  requireAuth,
  requireRole('seller', 'admin'),
  idRule,
  validate,
  submitForReview
);

// ----- Images ------------------------------------------------
router.post(
  '/:id/images',
  requireAuth,
  requireRole('seller', 'admin'),
  uploadLimiter,
  idRule,
  validate,
  uploadVehicleImages,
  uploadImages
);

router.delete(
  '/:id/images/:imageId',
  requireAuth,
  requireRole('seller', 'admin'),
  validate,
  deleteImage
);

// ----- Favorites ---------------------------------------------
router.post(
  '/:id/favorite',
  requireAuth,
  idRule,
  validate,
  toggleFavorite
);

module.exports = router;

// =============================================================
// END OF FILE: backend/src/routes/vehicleRoutes.js
// =============================================================