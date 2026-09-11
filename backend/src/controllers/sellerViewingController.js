// =============================================================
// FILE: backend/src/controllers/sellerViewingController.js
// =============================================================
// Purpose:
//   Seller/dealer viewing availability and viewing management
//   (§A.4 of the addendum).
//
//   Sellers may only touch their OWN availability and bookings.
//   No cross-seller access.
// =============================================================

'use strict';

const mongoose = require('mongoose');
const User = require('../models/User');
const Viewing = require('../models/Viewing');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { parsePagination, paginatedResponse } = require('../utils/pagination');

// -------- GET /api/sellers/me/availability
const getMyAvailability = asyncHandler(async (req, res) => {
  const user = await User.findById(req.userId).select('viewingAvailability').lean();
  res.json({ data: user?.viewingAvailability || null });
});

// -------- PATCH /api/sellers/me/availability
const setMyAvailability = asyncHandler(async (req, res) => {
  const {
    days,
    windows,
    slotMinutes,
    location,
    feeMinor,
    feeCurrency,
  } = req.body;

  if (!Array.isArray(days) || days.length === 0) {
    throw ApiError.badRequest('days must be a non-empty array');
  }
  if (!Array.isArray(windows) || windows.length === 0) {
    throw ApiError.badRequest('windows must be a non-empty array');
  }
  for (const w of windows) {
    if (!w || !w.start || !w.end) {
      throw ApiError.badRequest('Each window needs start and end (HH:mm)');
    }
  }

  const availability = {
    days: days.map((d) => Number(d)).filter((d) => d >= 0 && d <= 6),
    windows: windows.map((w) => ({ start: String(w.start), end: String(w.end) })),
    slotMinutes: Math.min(Math.max(Number(slotMinutes) || 60, 15), 480),
    location: String(location || '').slice(0, 300),
    feeMinor: Math.max(Number(feeMinor) || 0, 0),
    feeCurrency: feeCurrency === 'USD' ? 'USD' : 'KES',
  };

  await User.updateOne({ _id: req.userId }, { $set: { viewingAvailability: availability } });
  res.json({ data: availability });
});

// -------- GET /api/sellers/me/viewings
const listMyViewings = asyncHandler(async (req, res) => {
  const p = parsePagination(req.query);
  const filter = { seller: req.userId };
  if (req.query.bookingStatus) filter.bookingStatus = req.query.bookingStatus;

  const [items, total] = await Promise.all([
    Viewing.find(filter)
      .sort({ createdAt: -1 })
      .skip(p.skip)
      .limit(p.limit)
      .populate('vehicle', 'make model year images')
      .populate('buyer', 'name email phone')
      .lean(),
    Viewing.countDocuments(filter),
  ]);
  res.json(paginatedResponse(items, total, p));
});

// -------- POST /api/sellers/me/viewings/:id/cancel
const cancelAsSeller = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw ApiError.badRequest('Invalid id');

  const viewing = await Viewing.findById(id);
  if (!viewing) throw ApiError.notFound('Viewing not found');
  if (String(viewing.seller) !== String(req.userId)) {
    throw ApiError.forbidden('Not your viewing');
  }
  if (['cancelled-by-seller', 'completed'].includes(viewing.bookingStatus)) {
    throw ApiError.badRequest('Viewing cannot be cancelled in its current state');
  }

  viewing.bookingStatus = 'cancelled-by-seller';
  viewing.cancellation = {
    ...(viewing.cancellation || {}),
    cancelledAt: new Date(),
    cancelledBy: req.userId,
    cancelledByRole: 'seller',
    reason: req.body?.reason || '',
  };
  await viewing.save();

  res.json({ data: { _id: viewing._id, bookingStatus: viewing.bookingStatus } });
});

module.exports = {
  getMyAvailability,
  setMyAvailability,
  listMyViewings,
  cancelAsSeller,
};

// =============================================================
// END OF FILE: backend/src/controllers/sellerViewingController.js
// =============================================================