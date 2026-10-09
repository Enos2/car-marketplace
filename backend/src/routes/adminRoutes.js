// =============================================================
// FILE: backend/src/routes/adminRoutes.js
// =============================================================

'use strict';

const express = require('express');
const {
  dashboard, listListings, moderateVehicle,
  listUsers, setUserStatus,
  listReports, resolveReport,
  listAuditLogs,
} = require('../controllers/adminController');
const { moderateVehicleRules, userStatusRules } = require('../validators/adminValidators');
const { listAuctions, moderateAuction } = require('../controllers/adminAuctionController');
const validate = require('../middleware/validate');
const { requireAuth, requireRole } = require('../middleware/auth');
const adminViewingRoutes = require('./adminViewingRoutes');

const router = express.Router();

router.use(requireAuth, requireRole('admin'));

router.get('/dashboard', dashboard);
router.get('/listings', listListings);
router.patch('/listings/:id/moderate', moderateVehicleRules, validate, moderateVehicle);
router.get('/users', listUsers);
router.patch('/users/:id/status', userStatusRules, validate, setUserStatus);
router.get('/reports', listReports);
router.patch('/reports/:id', resolveReport);
router.get('/audit-logs', listAuditLogs);

// Auctions
router.get('/auctions', listAuctions);
router.patch('/auctions/:id/moderate', moderateAuction);

// Viewings (nested)
router.use('/viewings', adminViewingRoutes);

module.exports = router;

// =============================================================
// END OF FILE: backend/src/routes/adminRoutes.js
// =============================================================