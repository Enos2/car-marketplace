// =============================================================
// FILE: backend/src/routes/index.js
// =============================================================
// Purpose:
//   Single mount point for all API routers. Mounted under /api
//   by app.js.
// =============================================================

'use strict';

const express = require('express');
const mongoose = require('mongoose');

const authRoutes = require('./authRoutes');
const vehicleRoutes = require('./vehicleRoutes');
const inquiryRoutes = require('./inquiryRoutes');
const favoriteRoutes = require('./favoriteRoutes');
const sellerRoutes = require('./sellerRoutes');
const adminRoutes = require('./adminRoutes');
const exchangeRoutes = require('./exchangeRoutes');
const viewingRoutes = require('./viewingRoutes');
const sellerViewingRoutes = require('./sellerViewingRoutes');
const savedSearchRoutes = require('./savedSearchRoutes');
const reportRoutes = require('./reportRoutes');
const metaRoutes = require('./metaRoutes');

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

// ----- Deep health check (spec §28) --------------------------
// Reports overall status, process uptime, and DB connectivity.
// Returns 503 if the DB is unavailable so orchestrators can act.
router.get('/health', async (req, res) => {
  const dbState = mongoose.connection.readyState; // 1 = connected
  const dbOk = dbState === 1;
  const status = dbOk ? 200 : 503;
  res.status(status).json({
    ok: dbOk,
    uptime: process.uptime(),
    db: dbOk ? 'connected' : 'disconnected',
  });
});

// ----- Feature routers ---------------------------------------
router.use('/auth', authRoutes);
router.use('/vehicles', vehicleRoutes);
router.use('/inquiries', inquiryRoutes);
router.use('/favorites', favoriteRoutes);
router.use('/admin', adminRoutes);
router.use('/exchange', exchangeRoutes);
router.use('/viewings', viewingRoutes);
router.use('/saved-searches', savedSearchRoutes);
router.use('/reports', reportRoutes);
router.use('/meta', metaRoutes);

// Seller viewing sub-routes: mount under /sellers/me/... BEFORE
// the sellerRoutes so /me/... takes precedence over /:id.
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