// =============================================================
// FILE: backend/src/routes/viewingRoutes.js
// =============================================================
// Purpose:
//   Buyer-facing viewing routes. Admin routes for viewings are
//   added in Pass 4 under /api/admin/viewings.
//
//   Note: /api/vehicles/:id/viewings (create) and
//   /api/vehicles/:id/viewing-slots are mounted from routes/index.js
//   directly on the vehicle path so they nest correctly.
// =============================================================

'use strict';

const express = require('express');
const {
  listMyViewings,
  getMyViewing,
  getMyReceipt,
  cancelMyViewing,
} = require('../controllers/viewingController');
const {
  viewingIdRule,
  cancelViewingRules,
} = require('../validators/viewingValidators');
const validate = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.get('/mine', listMyViewings);
router.get('/:id', viewingIdRule, validate, getMyViewing);
router.get('/:id/receipt', viewingIdRule, validate, getMyReceipt);
router.post('/:id/cancel', cancelViewingRules, validate, cancelMyViewing);

module.exports = router;

// =============================================================
// END OF FILE: backend/src/routes/viewingRoutes.js
// =============================================================