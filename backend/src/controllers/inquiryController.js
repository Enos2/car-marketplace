// =============================================================
// FILE: backend/src/controllers/inquiryController.js
// =============================================================
// Purpose:
//   Buyer → seller enquiry flow (spec §8). Buyers see their own
//   enquiries; sellers see enquiries for their listings only.
// =============================================================

'use strict';

const crypto = require('crypto');
const Inquiry = require('../models/Inquiry');
const Vehicle = require('../models/Vehicle');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { parsePagination, paginatedResponse } = require('../utils/pagination');

function hashIp(ip) {
  return crypto.createHash('sha256').update(String(ip || '')).digest('hex').slice(0, 32);
}

const createInquiry = asyncHandler(async (req, res) => {
  const { vehicleId } = req.params;
  const { name, email, phone, preferredContact, message } = req.body;

  const vehicle = await Vehicle.findById(vehicleId).select('seller status');
  if (!vehicle) throw ApiError.notFound('Vehicle not found');
  if (vehicle.status !== 'published') throw ApiError.badRequest('Vehicle not available');

  const inquiry = await Inquiry.create({
    vehicle: vehicleId,
    seller: vehicle.seller,
    buyer: req.userId || null,
    name,
    email,
    phone: phone || '',
    preferredContact: preferredContact || 'any',
    message,
    meta: {
      ipHash: hashIp(req.ip),
      userAgent: (req.get('user-agent') || '').slice(0, 240),
    },
  });

  await Vehicle.updateOne({ _id: vehicleId }, { $inc: { 'stats.enquiries': 1 } });

  res.status(201).json({ data: { _id: inquiry._id, status: inquiry.status } });
});

// Seller inbox
const listMyInquiries = asyncHandler(async (req, res) => {
  const p = parsePagination(req.query);
  const filter = { seller: req.userId };
  if (req.query.status) filter.status = req.query.status;

  const [items, total] = await Promise.all([
    Inquiry.find(filter)
      .sort({ createdAt: -1 })
      .skip(p.skip)
      .limit(p.limit)
      .populate('vehicle', 'make model year images')
      .lean(),
    Inquiry.countDocuments(filter),
  ]);

  res.json(paginatedResponse(items, total, p));
});

const updateInquiry = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const inquiry = await Inquiry.findById(id);
  if (!inquiry) throw ApiError.notFound('Inquiry not found');
  if (String(inquiry.seller) !== String(req.userId) && req.user.role !== 'admin') {
    throw ApiError.forbidden('Not your inquiry');
  }

  if (req.body.status) inquiry.status = req.body.status;
  if (typeof req.body.sellerNotes === 'string') inquiry.sellerNotes = req.body.sellerNotes;

  await inquiry.save();
  res.json({ data: inquiry });
});

module.exports = { createInquiry, listMyInquiries, updateInquiry };

// =============================================================
// END OF FILE: backend/src/controllers/inquiryController.js
// =============================================================