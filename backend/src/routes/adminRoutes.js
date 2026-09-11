// =============================================================
// FILE: backend/src/routes/adminRoutes.js
// =============================================================
// Purpose:
//   Admin-only routes. All gated by requireRole('admin').
//   Every write is audited. Sub-mounts the viewing management
//   routes at /api/admin/viewings.
// =============================================================

'use strict';

const express = require('express');
const {
  dashboard,
  listListings,
  moderateVehicle,
  listUsers,
  setUserStatus,
  listReports,
  resolveReport,
  listAuditLogs,
} = require('../controllers/adminController');
const {
  moderateVehicleRules,
  userStatusRules,
} = require('../validators/adminValidators');
const validate = require('../middleware/validate');
const { requireAuth, requireRole } = require('../middleware/auth');
const adminViewingRoutes = require('./adminViewingRoutes');

const router = express.Router();

router.use(requireAuth, requireRole('admin'));

// ----- Dashboard ----------------------------------------------
router.get('/dashboard', dashboard);

// ----- Listings -----------------------------------------------
router.get('/listings', listListings);
router.patch('/listings/:id/moderate', moderateVehicleRules, validate, moderateVehicle);

// ----- Users --------------------------------------------------
router.get('/users', listUsers);
router.patch('/users/:id/status', userStatusRules, validate, setUserStatus);

// ----- Reports ------------------------------------------------
router.get('/reports', listReports);
router.patch('/reports/:id', resolveReport);

// ----- Audit logs ---------------------------------------------
router.get('/audit-logs', listAuditLogs);

// ----- Viewings (Section A.3, A.6 of the addendum) -----------
router.use('/viewings', adminViewingRoutes);

module.exports = router;

// =============================================================
// END OF FILE: backend/src/routes/adminRoutes.js
// =============================================================