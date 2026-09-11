// =============================================================
// FILE: backend/src/routes/inquiryRoutes.js
// =============================================================
// Purpose:
//   Seller-side inquiry management. Buyer-side creation lives in
//   vehicleRoutes (POST /api/vehicles/:id/inquiries).
// =============================================================

'use strict';

const express = require('express');
const {
  listMyInquiries,
  updateInquiry,
} = require('../controllers/inquiryController');
const { updateStatusRules } = require('../validators/inquiryValidators');
const validate = require('../middleware/validate');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth, requireRole('seller', 'admin'));

router.get('/', listMyInquiries);
router.patch('/:id', updateStatusRules, validate, updateInquiry);

module.exports = router;

// =============================================================
// END OF FILE: backend/src/routes/inquiryRoutes.js
// =============================================================