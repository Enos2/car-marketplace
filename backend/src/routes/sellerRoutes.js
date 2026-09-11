// =============================================================
// FILE: backend/src/routes/sellerRoutes.js
// =============================================================
// Purpose:
//   Public seller profile + own profile management + own stats.
// =============================================================

'use strict';

const express = require('express');
const {
  getPublicSeller,
  getPublicSellerVehicles,
  getMyProfile,
  updateMyProfile,
  getMyStats,
} = require('../controllers/sellerController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// ----- Own profile (must come before /:id) -------------------
router.get('/me', requireAuth, requireRole('seller', 'admin'), getMyProfile);
router.patch('/me', requireAuth, requireRole('seller', 'admin'), updateMyProfile);
router.get('/me/stats', requireAuth, requireRole('seller', 'admin'), getMyStats);

// ----- Public profile ----------------------------------------
router.get('/:id', getPublicSeller);
router.get('/:id/vehicles', getPublicSellerVehicles);

module.exports = router;

// =============================================================
// END OF FILE: backend/src/routes/sellerRoutes.js
// =============================================================