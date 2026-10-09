// =============================================================
// FILE: backend/src/controllers/adminAuctionController.js
// =============================================================
// Purpose:
//   Admin moderation of auction submissions.
// =============================================================

'use strict';

const mongoose = require('mongoose');
const Auction = require('../models/Auction');
const AuditLog = require('../models/AuditLog');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { parsePagination, paginatedResponse } = require('../utils/pagination');

async function writeAudit(req, action, auctionId, metadata = {}) {
  await AuditLog.create({
    actor: req.userId,
    action,
    targetType: 'auction',
    targetId: auctionId,
    metadata,
    ip: req.ip,
    userAgent: req.get('user-agent') || '',
  });
}

const listAuctions = asyncHandler(async (req, res) => {
  const p = parsePagination(req.query);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  const [items, total] = await Promise.all([
    Auction.find(filter)
      .sort({ createdAt: -1 })
      .skip(p.skip)
      .limit(p.limit)
      .populate('seller', 'name email')
      .populate('vehicle', 'make model year')
      .lean(),
    Auction.countDocuments(filter),
  ]);
  res.json(paginatedResponse(items, total, p));
});

const moderateAuction = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { action, reason } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) throw ApiError.badRequest('Invalid id');

  const auction = await Auction.findById(id);
  if (!auction) throw ApiError.notFound('Auction not found');

  switch (action) {
    case 'approve':
      // Publish immediately: set status live and adjust start time if needed
      auction.status = 'live';
      if (auction.startsAt > new Date()) {
        // keep startsAt as set
      }
      break;
    case 'reject':
      auction.status = 'rejected';
      break;
    case 'cancel':
      auction.status = 'cancelled';
      break;
    case 'settle':
      auction.status = 'settled';
      auction.settledAt = new Date();
      break;
    default:
      throw ApiError.badRequest('Unknown action');
  }

  auction.moderation = {
    reviewedBy: req.userId,
    reviewedAt: new Date(),
    reason: reason || '',
  };
  await auction.save();
  await writeAudit(req, `auction.${action}`, auction._id, { reason });

  res.json({ data: auction });
});

module.exports = { listAuctions, moderateAuction };

// =============================================================
// END OF FILE: backend/src/controllers/adminAuctionController.js
// =============================================================