// =============================================================
// FILE: backend/src/controllers/adminViewingController.js
// =============================================================
// Purpose:
//   Admin viewing management (§A.3) and receipt review tracking
//   (§A.6, §B).
//
// Rules enforced here:
//   - GET  /:id/receipt                 does NOT change status
//   - GET  /:id/receipt/download        does NOT change status
//   - POST /:id/receipt/mark-viewed     is the ONLY way a receipt
//                                       becomes Viewed; idempotent
//   - PATCH /:id/reschedule             sets review status via the
//                                       state machine
//   - Every receipt read and every mark-viewed writes to
//     receipt_access_logs (append-only)
// =============================================================

'use strict';

const mongoose = require('mongoose');
const Viewing = require('../models/Viewing');
const ReceiptAccessLog = require('../models/ReceiptAccessLog');
const AuditLog = require('../models/AuditLog');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { parsePagination, paginatedResponse } = require('../utils/pagination');
const viewingStateMachine = require('../services/viewingStateMachine');
const signedUrlService = require('../services/signedUrlService');
const receiptAccessService = require('../services/receiptAccessService');
const receiptService = require('../services/receiptService');
const emailService = require('../services/emailService');
const env = require('../config/env');

// -------- audit helper --------------------------------------
async function writeAudit(req, action, viewingId, metadata = {}) {
  await AuditLog.create({
    actor: req.userId,
    action,
    targetType: 'viewing',
    targetId: viewingId,
    metadata,
    ip: req.ip,
    userAgent: req.get('user-agent') || '',
  });
}

// -------- GET /api/admin/viewings ---------------------------
const listViewings = asyncHandler(async (req, res) => {
  const p = parsePagination(req.query);
  const filter = {};

  if (req.query.receiptStatus) filter['receipt.reviewStatus'] = req.query.receiptStatus;
  if (req.query.bookingStatus) filter.bookingStatus = req.query.bookingStatus;
  if (req.query.vehicleId && mongoose.Types.ObjectId.isValid(req.query.vehicleId)) {
    filter.vehicle = req.query.vehicleId;
  }
  if (req.query.buyerId && mongoose.Types.ObjectId.isValid(req.query.buyerId)) {
    filter.buyer = req.query.buyerId;
  }
  if (req.query.sellerId && mongoose.Types.ObjectId.isValid(req.query.sellerId)) {
    filter.seller = req.query.sellerId;
  }
  if (req.query.date) filter.date = req.query.date;

  const [items, total] = await Promise.all([
    Viewing.find(filter)
      .sort({ createdAt: -1 })
      .skip(p.skip)
      .limit(p.limit)
      .populate('vehicle', 'make model year')
      .populate('buyer', 'name email')
      .populate('seller', 'name email')
      .lean(),
    Viewing.countDocuments(filter),
  ]);

  res.json(paginatedResponse(items, total, p));
});

// -------- GET /api/admin/viewings/:id -----------------------
const getViewing = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw ApiError.badRequest('Invalid id');

  const viewing = await Viewing.findById(id)
    .populate('vehicle', 'make model year images')
    .populate('buyer', 'name email phone')
    .populate('seller', 'name email phone')
    .lean();
  if (!viewing) throw ApiError.notFound('Viewing not found');

  res.json({ data: viewing });
});

// -------- GET /api/admin/viewings/:id/receipt ---------------
// Returns receipt data + a signed URL. Never changes status.
const getReceipt = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw ApiError.badRequest('Invalid id');

  const viewing = await Viewing.findById(id)
    .populate('vehicle', 'make model year')
    .populate('buyer', 'name email')
    .populate('seller', 'name email')
    .lean();
  if (!viewing) throw ApiError.notFound('Viewing not found');

  await receiptAccessService.record({
    adminId: req.userId,
    viewingId: viewing._id,
    receiptId: viewing.receipt.receiptId,
    action: 'view',
    ip: req.ip,
    userAgent: req.get('user-agent') || '',
  });

  const token = signedUrlService.signReceiptToken(viewing.receipt.receiptId);

  res.json({
    data: {
      receiptNumber: viewing.receipt.receiptNumber,
      reviewStatus: viewing.receipt.reviewStatus,
      generatedAt: viewing.receipt.generatedAt,
      emailedAt: viewing.receipt.emailedAt,
      emailDelivered: viewing.receipt.emailDelivered,
      viewedBy: viewing.receipt.viewedBy,
      viewedAt: viewing.receipt.viewedAt,
      pendingSince: viewing.receipt.pendingSince,
      postponedSince: viewing.receipt.postponedSince,
      rescheduledStatusSince: viewing.receipt.rescheduledStatusSince,
      statusHistory: viewing.receipt.statusHistory,
      text: receiptService.buildReceiptText(viewing),
      signedUrl: `/api/admin/viewings/${viewing._id}/receipt/download?token=${token}`,
      signedUrlExpiresInMinutes: env.RECEIPT_SIGNED_URL_EXPIRES_MINUTES,
    },
  });
});

// -------- GET /api/admin/viewings/:id/receipt/download ------
// Serves the receipt text via signed token.
const downloadReceipt = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { token } = req.query;

  const check = signedUrlService.verifyReceiptToken(token);
  if (!check.ok) throw ApiError.forbidden(`Receipt link invalid: ${check.reason}`);

  const viewing = await Viewing.findById(id)
    .populate('vehicle', 'make model year')
    .populate('buyer', 'name email')
    .populate('seller', 'name email')
    .lean();
  if (!viewing) throw ApiError.notFound('Viewing not found');
  if (viewing.receipt.receiptId !== check.receiptId) {
    throw ApiError.forbidden('Token does not match this receipt');
  }

  if (req.userId) {
    await receiptAccessService.record({
      adminId: req.userId,
      viewingId: viewing._id,
      receiptId: viewing.receipt.receiptId,
      action: 'view',
      ip: req.ip,
      userAgent: req.get('user-agent') || '',
    });
  }

  res.type('text/plain').send(receiptService.buildReceiptText(viewing));
});

// -------- POST /api/admin/viewings/:id/receipt/mark-viewed --
const markReceiptViewed = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw ApiError.badRequest('Invalid id');

  const viewing = await Viewing.findById(id);
  if (!viewing) throw ApiError.notFound('Viewing not found');

  const result = viewingStateMachine.markViewed(viewing, {
    adminId: req.userId,
    reason: 'Admin marked as reviewed',
  });

  if (result.changed) {
    await viewing.save();
    await receiptAccessService.record({
      adminId: req.userId,
      viewingId: viewing._id,
      receiptId: viewing.receipt.receiptId,
      action: 'mark_viewed',
      ip: req.ip,
      userAgent: req.get('user-agent') || '',
    });
    await writeAudit(req, 'viewing.receipt.mark_viewed', viewing._id, {});
  }

  res.json({
    data: {
      _id: viewing._id,
      reviewStatus: viewing.receipt.reviewStatus,
      viewedBy: viewing.receipt.viewedBy,
      viewedAt: viewing.receipt.viewedAt,
      changed: result.changed,
    },
  });
});

// -------- PATCH /api/admin/viewings/:id/reschedule ----------
const rescheduleViewing = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw ApiError.badRequest('Invalid id');

  const { date, startTime, endTime, location, reason } = req.body;

  const viewing = await Viewing.findById(id);
  if (!viewing) throw ApiError.notFound('Viewing not found');

  const previous = {
    previousDate: viewing.date,
    previousStartTime: viewing.startTime,
    previousEndTime: viewing.endTime,
    previousLocation: viewing.location,
    newDate: date,
    newStartTime: startTime,
    newEndTime: endTime,
    newLocation: location || viewing.location,
    reason: reason || '',
    changedBy: req.userId,
    changedAt: new Date(),
  };

  viewing.rescheduleHistory.push(previous);
  viewing.date = date;
  viewing.startTime = startTime;
  viewing.endTime = endTime;
  if (location) viewing.location = location;
  viewing.bookingStatus = 'rescheduled';

  viewingStateMachine.onReschedule(viewing, {
    adminId: req.userId,
    reason: reason || 'Viewing rescheduled',
  });

  await viewing.save();

  const text = [
    'Your viewing has been rescheduled.',
    '',
    `Reference: ${viewing.reference}`,
    `New date:  ${viewing.date}`,
    `New time:  ${viewing.startTime} - ${viewing.endTime}`,
    `Location:  ${viewing.location}`,
    reason ? `Reason:    ${reason}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  await emailService.send({
    to: viewing.buyerContact.email,
    subject: `Viewing rescheduled — ${viewing.reference}`,
    text,
  });

  await writeAudit(req, 'viewing.reschedule', viewing._id, {
    previous,
    new: { date, startTime, endTime, location },
  });

  res.json({ data: viewing });
});

// -------- GET /api/admin/viewings/:id/receipt-access-log ----
const getReceiptAccessLog = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw ApiError.badRequest('Invalid id');

  const log = await ReceiptAccessLog.find({ viewing: id })
    .sort({ timestamp: -1 })
    .populate('admin', 'name email')
    .lean();

  res.json({ data: log });
});

module.exports = {
  listViewings,
  getViewing,
  getReceipt,
  downloadReceipt,
  markReceiptViewed,
  rescheduleViewing,
  getReceiptAccessLog,
};

// =============================================================
// END OF FILE: backend/src/controllers/adminViewingController.js
// =============================================================