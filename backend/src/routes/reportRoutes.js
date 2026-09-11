// =============================================================
// FILE: backend/src/routes/reportRoutes.js
// =============================================================
// Purpose:
//   Report creation endpoint. Admin listing/resolution lives in
//   adminRoutes.js. Auth is optional here — a guest can report
//   a listing.
// =============================================================

'use strict';

const express = require('express');
const { createReport } = require('../controllers/reportController');
const { createRules } = require('../validators/reportValidators');
const validate = require('../middleware/validate');
const { inquiryLimiter } = require('../middleware/rateLimiters');

const router = express.Router();

// POST /api/reports
router.post('/', inquiryLimiter, createRules, validate, createReport);

module.exports = router;

// =============================================================
// END OF FILE: backend/src/routes/reportRoutes.js
// =============================================================