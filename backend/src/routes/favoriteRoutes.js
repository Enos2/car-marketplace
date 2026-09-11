// =============================================================
// FILE: backend/src/routes/favoriteRoutes.js
// =============================================================
// Purpose:
//   List current user's favorites. Toggle is handled by
//   POST /api/vehicles/:id/favorite.
// =============================================================

'use strict';

const express = require('express');
const { listMyFavorites } = require('../controllers/favoriteController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, listMyFavorites);

module.exports = router;

// =============================================================
// END OF FILE: backend/src/routes/favoriteRoutes.js
// =============================================================