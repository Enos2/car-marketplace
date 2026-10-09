// =============================================================
// FILE: backend/src/routes/auctionRoutes.js
// =============================================================
// Purpose:
//   Public + seller auction routes. Admin routes live in
//   adminRoutes.js.
// =============================================================

'use strict';

const express = require('express');
const {
  listAuctions,
  getAuction,
  createAuction,
  placeBid,
  listMyAuctions,
  cancelMyAuction,
} = require('../controllers/auctionController');
const { requireAuth, requireRole } = require('../middleware/auth');
const { bookingLimiter } = require('../middleware/rateLimiters');

const router = express.Router();

// Public
router.get('/', listAuctions);
router.get('/:id', getAuction);

// Seller
router.get('/me/list', requireAuth, requireRole('seller', 'admin'), listMyAuctions);
router.post('/', requireAuth, requireRole('seller', 'admin'), createAuction);
router.post('/:id/bids', requireAuth, bookingLimiter, placeBid);
router.post('/:id/cancel', requireAuth, requireRole('seller', 'admin'), cancelMyAuction);

module.exports = router;

// =============================================================
// END OF FILE: backend/src/routes/auctionRoutes.js
// =============================================================