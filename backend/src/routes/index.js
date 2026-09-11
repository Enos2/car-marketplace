// =============================================================
// FILE: backend/src/routes/index.js
// =============================================================
// Purpose:
//   Single mount point for all API routers. Mounted under /api
//   by app.js.
//
//   Nested routes (kept here to avoid /:id ordering issues):
//     POST /api/vehicles/:id/viewings
//     GET  /api/vehicles/:id/viewing-slots
//     POST /api/vehicles/:id/inquiries
// =============================================================

'use strict';

const express = require('express');

const authRoutes = require('./authRoutes');
const vehicleRoutes = require('./vehicleRoutes');
const inquiryRoutes = require('./inquiryRoutes');
const favoriteRoutes = require('./favoriteRoutes');
const sellerRoutes = require('./sellerRoutes');
const adminRoutes = require('./adminRoutes');
const exchangeRoutes = require('./exchangeRoutes');
const viewingRoutes = require('./viewingRoutes');
const sellerViewingRoutes = require('./sellerViewingRoutes');

const { createInquiry } = require('../controllers/inquiryController');
const {
  getViewingSlots,
  createViewing,
} = require('../controllers/viewingController');

const { createRules } = require('../validators/inquiryValidators');
const {
  createViewingRules,
  slotQueryRules,
} = require('../validators/viewingValidators');

const validate = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const {
  inquiryLimiter,
  bookingLimiter,
} = require('../middleware/rateLimiters');

const router = express.Router();

// ----- Health -------------------------------------------------
router.get('/health', (req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

// ----- Feature routers ---------------------------------------
router.use('/auth', authRoutes);
router.use('/vehicles', vehicleRoutes);
router.use('/inquiries', inquiryRoutes);
router.use('/favorites', favoriteRoutes);
router.use('/admin', adminRoutes);
router.use('/exchange', exchangeRoutes);
router.use('/viewings', viewingRoutes);

// Seller viewing sub-routes: mount under /sellers/me/... BEFORE
// the sellerRoutes so /me/availability and /me/viewings take
// precedence over /:id.
router.use('/sellers/me', sellerViewingRoutes);
router.use('/sellers', sellerRoutes);

// ----- Nested: vehicle-scoped actions ------------------------
router.post(
  '/vehicles/:vehicleId/inquiries',
  inquiryLimiter,
  createRules,
  validate,
  createInquiry
);

router.get(
  '/vehicles/:id/viewing-slots',
  slotQueryRules,
  validate,
  getViewingSlots
);

router.post(
  '/vehicles/:id/viewings',
  requireAuth,
  bookingLimiter,
  createViewingRules,
  validate,
  createViewing
);

module.exports = router;

// =============================================================
// END OF FILE: backend/src/routes/index.js
// =============================================================