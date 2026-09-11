// =============================================================
// FILE: backend/src/controllers/inquiryController.js
// =============================================================
// Purpose:
//   Buyer → seller enquiry flow (spec §8). Sends a best-effort
//   email to the seller when a new enquiry is created (the
//   emailService stub logs to console in dev).
// =============================================================

'use strict';

const crypto = require('crypto');
const Inquiry = require('../models/Inquiry');
const Vehicle = require('../models/Vehicle');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { parsePagination, paginatedResponse } = require('../utils/pagination');
const emailService = require('../services/emailService');
const logger = require('../utils/logger');

function hashIp(ip) {
  return crypto.createHash('sha256').update(String(ip || '')).digest('hex').slice(0, 32);
}

const createInquiry = asyncHandler(async (req, res) => {
  const { vehicleId } = req.params;
  const { name, email, phone, preferredContact, message } = req.body;

  const vehicle = await Vehicle.findById(vehicleId)
    .select('seller status make model year')
    .lean();
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

  // Best-effort seller notification. Failure does not block the response.
  notifySeller(vehicle, inquiry).catch((err) => {
    logger.warn('Inquiry notification failed (non-fatal)', {
      inquiryId: String(inquiry._id),
      reason: err.message,
    });
  });

  res.status(201).json({ data: { _id: inquiry._id, status: inquiry.status } });
});

async function notifySeller(vehicle, inquiry) {
  const seller = await User.findById(vehicle.seller)
    .select('name email contactPreferences')
    .lean();
  if (!seller || !seller.email) return;
  if (seller.contactPreferences && seller.contactPreferences.emailNotifications === false) return;

  const vehicleLabel = `${vehicle.year || ''} ${vehicle.make || ''} ${vehicle.model || ''}`.trim();

  const text = [
    `New enquiry about your listing: ${vehicleLabel}`,
    '',
    `From:   ${inquiry.name}`,
    `Email:  ${inquiry.email}`,
    inquiry.phone ? `Phone:  ${inquiry.phone}` : null,
    `Prefers: ${inquiry.preferredContact || 'any'}`,
    '',
    'Message:',
    inquiry.message,
    '',
    `— Reply from your seller dashboard`,
  ]
    .filter(Boolean)
    .join('\n');

  await emailService.send({
    to: seller.email,
    subject: `New enquiry — ${vehicleLabel}`,
    text,
  });
}

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