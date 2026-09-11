// =============================================================
// FILE: backend/src/routes/index.js
// =============================================================
// Purpose:
//   Single mount point for all API routers. app.js imports this
//   and mounts everything under /api.
//
//   Inquiry creation route is nested under vehicle:
//     POST /api/vehicles/:id/inquiries
//   The seller-side inquiry list lives at:
//     GET  /api/inquiries
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

const { createInquiry } = require('../controllers/inquiryController');
const { createRules } = require('../validators/inquiryValidators');
const validate = require('../middleware/validate');
const { inquiryLimiter } = require('../middleware/rateLimiters');

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
router.use('/sellers', sellerRoutes);
router.use('/admin', adminRoutes);
router.use('/exchange', exchangeRoutes);

// ----- Nested: create inquiry on a vehicle -------------------
// Registered here (not in vehicleRoutes) to keep the buyer-side
// flow in one place and avoid ordering issues with /:id routes.
router.post(
  '/vehicles/:vehicleId/inquiries',
  inquiryLimiter,
  createRules,
  validate,
  createInquiry
);

module.exports = router;

// =============================================================
// END OF FILE: backend/src/routes/index.js
// =============================================================