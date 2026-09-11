// =============================================================
// FILE: backend/src/routes/adminViewingRoutes.js
// =============================================================
// Purpose:
//   Admin viewing management + receipt review tracking. Mounted
//   under /api/admin/viewings from routes/adminRoutes.js.
// =============================================================

'use strict';

const express = require('express');
const {
  listViewings,
  getViewing,
  getReceipt,
  downloadReceipt,
  markReceiptViewed,
  rescheduleViewing,
  getReceiptAccessLog,
} = require('../controllers/adminViewingController');
const {
  adminListRules,
  adminRescheduleRules,
  markViewedRules,
  viewingIdRule,
} = require('../validators/viewingValidators');
const validate = require('../middleware/validate');
const { markViewedLimiter } = require('../middleware/rateLimiters');

const router = express.Router();

router.get('/', adminListRules, validate, listViewings);

router.get('/:id', viewingIdRule, validate, getViewing);

router.get('/:id/receipt', viewingIdRule, validate, getReceipt);

// Signed-token download. The token itself is the authorization
// for this read; admin session adds audit detail when present.
router.get('/:id/receipt/download', viewingIdRule, validate, downloadReceipt);

router.post(
  '/:id/receipt/mark-viewed',
  markViewedLimiter,
  markViewedRules,
  validate,
  markReceiptViewed
);

router.get('/:id/receipt-access-log', viewingIdRule, validate, getReceiptAccessLog);

router.patch('/:id/reschedule', adminRescheduleRules, validate, rescheduleViewing);

module.exports = router;

// =============================================================
// END OF FILE: backend/src/routes/adminViewingRoutes.js
// =============================================================