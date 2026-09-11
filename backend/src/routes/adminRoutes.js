// =============================================================
// FILE: backend/src/routes/adminRoutes.js
// =============================================================
// Purpose:
//   Admin-only routes. All gated by requireRole('admin').
//   Every write is audited.
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

module.exports = router;

// =============================================================
// END OF FILE: backend/src/routes/adminRoutes.js
// =============================================================