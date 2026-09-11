// =============================================================
// FILE: backend/src/routes/exchangeRoutes.js
// =============================================================
// Purpose:
//   Public read of latest USD/KES rate. Admin-only refresh.
// =============================================================

'use strict';

const express = require('express');
const { getRate, refresh } = require('../controllers/exchangeController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/rate', getRate);
router.post('/refresh', requireAuth, requireRole('admin'), refresh);

module.exports = router;

// =============================================================
// END OF FILE: backend/src/routes/exchangeRoutes.js
// =============================================================