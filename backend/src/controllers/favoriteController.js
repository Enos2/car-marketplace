// =============================================================
// FILE: backend/src/controllers/favoriteController.js
// =============================================================
// Purpose:
//   List a signed-in user's favorites (spec §12).
// =============================================================

'use strict';

const Favorite = require('../models/Favorite');
const asyncHandler = require('../utils/asyncHandler');
const { parsePagination, paginatedResponse } = require('../utils/pagination');

const listMyFavorites = asyncHandler(async (req, res) => {
  const p = parsePagination(req.query);

  const [items, total] = await Promise.all([
    Favorite.find({ user: req.userId })
      .sort({ createdAt: -1 })
      .skip(p.skip)
      .limit(p.limit)
      .populate('vehicle')
      .lean(),
    Favorite.countDocuments({ user: req.userId }),
  ]);

  // Only return vehicles that still exist and are published
  const data = items
    .filter((f) => f.vehicle && f.vehicle.status === 'published')
    .map((f) => f.vehicle);

  res.json(paginatedResponse(data, total, p));
});

module.exports = { listMyFavorites };

// =============================================================
// END OF FILE: backend/src/controllers/favoriteController.js
// =============================================================