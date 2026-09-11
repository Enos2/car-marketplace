// =============================================================
// FILE: backend/src/routes/sellerViewingRoutes.js
// =============================================================
// Purpose:
//   Seller availability + seller viewing management. Mounted
//   under /api/sellers/me/... from routes/index.js.
// =============================================================

'use strict';

const express = require('express');
const {
  getMyAvailability,
  setMyAvailability,
  listMyViewings,
  cancelAsSeller,
} = require('../controllers/sellerViewingController');
const {
  availabilityRules,
  cancelViewingRules,
} = require('../validators/viewingValidators');
const validate = require('../middleware/validate');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth, requireRole('seller', 'admin'));

router.get('/availability', getMyAvailability);
router.patch('/availability', availabilityRules, validate, setMyAvailability);

router.get('/viewings', listMyViewings);
router.post('/viewings/:id/cancel', cancelViewingRules, validate, cancelAsSeller);

module.exports = router;

// =============================================================
// END OF FILE: backend/src/routes/sellerViewingRoutes.js
// =============================================================