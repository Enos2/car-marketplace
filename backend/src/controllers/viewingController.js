// =============================================================
// FILE: backend/src/controllers/viewingController.js
// =============================================================
// Purpose:
//   Buyer-facing endpoints for viewings: slots, booking, list
//   own bookings, view own receipt, cancel own booking.
//
//   Never accepts a status value from the client. The service
//   layer decides all transitions.
// =============================================================

'use strict';

const mongoose = require('mongoose');
const Viewing = require('../models/Viewing');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { parsePagination, paginatedResponse } = require('../utils/pagination');
const viewingService = require('../services/viewingService');
const receiptService = require('../services/receiptService');

// -------- GET /api/vehicles/:id/viewing-slots?date=YYYY-MM-DD
const getViewingSlots = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { date } = req.query;

  if (!mongoose.Types.ObjectId.isValid(id)) throw ApiError.badRequest('Invalid vehicle id');

  const result = await viewingService.listAvailableSlots(id, date);
  res.json({ data: result });
});

// -------- POST /api/vehicles/:id/viewings
const createViewing = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const booking = await viewingService.createBooking({
    buyerUser: req.user,
    vehicleId: id,
    input: req.body,
  });

  // Free viewings confirm immediately → issue receipt now.
  // Paid viewings will issue the receipt after the payment webhook
  // (Pass 3).
  if (booking.bookingStatus === 'confirmed') {
    await receiptService.issueReceipt(booking);
  }

  res.status(201).json({
    data: {
      _id: booking._id,
      reference: booking.reference,
      bookingStatus: booking.bookingStatus,
      viewingType: booking.viewingType,
      feeMinor: booking.feeMinor,
      feeCurrency: booking.feeCurrency,
      date: booking.date,
      startTime: booking.startTime,
      endTime: booking.endTime,
      location: booking.location,
      receipt: {
        receiptNumber: booking.receipt.receiptNumber,
        reviewStatus: booking.receipt.reviewStatus,
      },
    },
  });
});

// -------- GET /api/viewings/mine
const listMyViewings = asyncHandler(async (req, res) => {
  const p = parsePagination(req.query);
  const filter = { buyer: req.userId };

  const [items, total] = await Promise.all([
    Viewing.find(filter)
      .sort({ createdAt: -1 })
      .skip(p.skip)
      .limit(p.limit)
      .populate('vehicle', 'make model year images')
      .populate('seller', 'name')
      .lean(),
    Viewing.countDocuments(filter),
  ]);

  res.json(paginatedResponse(items, total, p));
});

// -------- GET /api/viewings/:id
const getMyViewing = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw ApiError.badRequest('Invalid id');

  const viewing = await Viewing.findById(id)
    .populate('vehicle', 'make model year images')
    .populate('seller', 'name')
    .lean();
  if (!viewing) throw ApiError.notFound('Viewing not found');

  // Ownership check: buyer, seller of that booking, or admin.
  const isBuyer = String(viewing.buyer) === String(req.userId);
  const isSeller = String(viewing.seller._id || viewing.seller) === String(req.userId);
  const isAdmin = req.user.role === 'admin';
  if (!isBuyer && !isSeller && !isAdmin) {
    throw ApiError.forbidden('Not your viewing');
  }

  res.json({ data: viewing });
});

// -------- GET /api/viewings/:id/receipt
const getMyReceipt = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw ApiError.badRequest('Invalid id');

  const viewing = await Viewing.findById(id)
    .populate('vehicle', 'make model year')
    .populate('seller', 'name')
    .lean();
  if (!viewing) throw ApiError.notFound('Viewing not found');
  if (String(viewing.buyer) !== String(req.userId) && req.user.role !== 'admin') {
    throw ApiError.forbidden('Not your receipt');
  }

  res.json({
    data: {
      receiptNumber: viewing.receipt.receiptNumber,
      generatedAt: viewing.receipt.generatedAt,
      emailedAt: viewing.receipt.emailedAt,
      emailDelivered: viewing.receipt.emailDelivered,
      text: receiptService.buildReceiptText(viewing),
      viewing: {
        reference: viewing.reference,
        date: viewing.date,
        startTime: viewing.startTime,
        endTime: viewing.endTime,
        location: viewing.location,
        viewingType: viewing.viewingType,
        feeMinor: viewing.feeMinor,
        feeCurrency: viewing.feeCurrency,
        bookingStatus: viewing.bookingStatus,
        paymentStatus: viewing.payment.status,
      },
    },
  });
});

// -------- POST /api/viewings/:id/cancel
const cancelMyViewing = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw ApiError.badRequest('Invalid id');

  const viewing = await Viewing.findById(id);
  if (!viewing) throw ApiError.notFound('Viewing not found');
  if (String(viewing.buyer) !== String(req.userId)) {
    throw ApiError.forbidden('Not your viewing');
  }
  if (['cancelled-by-buyer', 'completed'].includes(viewing.bookingStatus)) {
    throw ApiError.badRequest('Viewing cannot be cancelled in its current state');
  }

  viewing.bookingStatus = 'cancelled-by-buyer';
  viewing.cancellation = {
    ...(viewing.cancellation || {}),
    cancelledAt: new Date(),
    cancelledBy: req.userId,
    cancelledByRole: 'buyer',
    reason: req.body?.reason || '',
  };
  await viewing.save();

  res.json({ data: { _id: viewing._id, bookingStatus: viewing.bookingStatus } });
});

module.exports = {
  getViewingSlots,
  createViewing,
  listMyViewings,
  getMyViewing,
  getMyReceipt,
  cancelMyViewing,
};

// =============================================================
// END OF FILE: backend/src/controllers/viewingController.js
// =============================================================