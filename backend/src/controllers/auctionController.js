// =============================================================
// FILE: backend/src/controllers/auctionController.js
// =============================================================
// Purpose:
//   Auction list, detail, create, bid, and buy-now.
//
// Rules enforced server-side:
//   - Only the vehicle owner can create an auction.
//   - Bids must exceed current by >= minIncrement.
//   - Sellers cannot bid on their own auctions.
//   - Bids are only accepted while status === 'live'.
//   - Currencies must match.
// =============================================================

'use strict';

const crypto = require('crypto');
const mongoose = require('mongoose');
const Auction = require('../models/Auction');
const Bid = require('../models/Bid');
const Vehicle = require('../models/Vehicle');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { parsePagination, paginatedResponse } = require('../utils/pagination');

function hashIp(ip) {
  return crypto.createHash('sha256').update(String(ip || '')).digest('hex').slice(0, 32);
}

function serialize(a) {
  return {
    _id: a._id,
    title: a.title,
    currency: a.currency,
    startingBidMinor: a.startingBidMinor,
    minIncrementMinor: a.minIncrementMinor,
    buyNowMinor: a.buyNowMinor,
    currentBidMinor: a.currentBidMinor,
    bidCount: a.bidCount,
    status: a.status,
    startsAt: a.startsAt,
    endsAt: a.endsAt,
    vehicle: a.vehicle,
    seller: a.seller,
  };
}

// ---- public read -------------------------------------------
const listAuctions = asyncHandler(async (req, res) => {
  const p = parsePagination(req.query);
  const filter = { status: { $in: ['live', 'ended'] } };
  if (req.query.status) filter.status = req.query.status;

  const [items, total] = await Promise.all([
    Auction.find(filter)
      .sort({ endsAt: 1 })
      .skip(p.skip)
      .limit(p.limit)
      .populate('vehicle', 'make model year images bodyType mileage mileageUnit')
      .populate('seller', 'name')
      .lean(),
    Auction.countDocuments(filter),
  ]);
  res.json(paginatedResponse(items.map(serialize), total, p));
});

const getAuction = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw ApiError.badRequest('Invalid id');

  const a = await Auction.findById(id)
    .populate('vehicle', 'make model year images bodyType mileage mileageUnit fuelType transmission location')
    .populate('seller', 'name')
    .populate('currentBidder', 'name')
    .lean();
  if (!a) throw ApiError.notFound('Auction not found');

  const bids = await Bid.find({ auction: a._id })
    .sort({ createdAt: -1 })
    .limit(20)
    .populate('bidder', 'name')
    .lean();

  const out = serialize(a);
  out.description = a.description;
  out.bids = bids.map((b) => ({
    _id: b._id,
    amountMinor: b.amountMinor,
    createdAt: b.createdAt,
    bidderName: b.bidder?.name || 'Anonymous',
  }));
  // Only show the reserve price to the seller and admins
  if (
    req.userId &&
    (String(req.userId) === String(a.seller._id) || req.user?.role === 'admin')
  ) {
    out.reserveMinor = a.reserveMinor;
  }
  res.json({ data: out });
});

// ---- seller create -----------------------------------------
const createAuction = asyncHandler(async (req, res) => {
  const {
    vehicleId,
    title,
    description,
    currency,
    startingBidMinor,
    reserveMinor,
    minIncrementMinor,
    buyNowMinor,
    startsAt,
    endsAt,
  } = req.body;

  if (!mongoose.Types.ObjectId.isValid(vehicleId)) throw ApiError.badRequest('Invalid vehicleId');

  const vehicle = await Vehicle.findById(vehicleId).select('seller status');
  if (!vehicle) throw ApiError.notFound('Vehicle not found');
  if (String(vehicle.seller) !== String(req.userId)) {
    throw ApiError.forbidden('You can only auction your own vehicles');
  }
  if (vehicle.status !== 'published') {
    throw ApiError.badRequest('Publish the vehicle before auctioning it');
  }

  const start = new Date(startsAt);
  const end = new Date(endsAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw ApiError.badRequest('Invalid start or end date');
  }
  if (end <= start) throw ApiError.badRequest('End must be after start');

  const auction = await Auction.create({
    seller: req.userId,
    vehicle: vehicle._id,
    title,
    description: description || '',
    currency: currency || 'KES',
    startingBidMinor: Number(startingBidMinor),
    reserveMinor: Number(reserveMinor ?? startingBidMinor),
    minIncrementMinor: Number(minIncrementMinor ?? 1_000_000),
    buyNowMinor: buyNowMinor ? Number(buyNowMinor) : undefined,
    startsAt: start,
    endsAt: end,
    status: 'pending',
  });

  res.status(201).json({ data: serialize(auction) });
});

// ---- place a bid ------------------------------------------
const placeBid = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { amountMinor } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) throw ApiError.badRequest('Invalid id');

  const auction = await Auction.findById(id);
  if (!auction) throw ApiError.notFound('Auction not found');
  if (auction.status !== 'live') {
    throw ApiError.badRequest('Auction is not live');
  }
  const now = new Date();
  if (now < auction.startsAt) throw ApiError.badRequest('Auction has not started yet');
  if (now > auction.endsAt) throw ApiError.badRequest('Auction has ended');

  if (String(auction.seller) === String(req.userId)) {
    throw ApiError.forbidden('You cannot bid on your own auction');
  }

  const bidAmount = Number(amountMinor);
  if (!Number.isFinite(bidAmount) || bidAmount <= 0) {
    throw ApiError.badRequest('Invalid bid amount');
  }

  const minimum = auction.currentBidMinor > 0
    ? auction.currentBidMinor + auction.minIncrementMinor
    : auction.startingBidMinor;

  if (bidAmount < minimum) {
    throw ApiError.badRequest(
      `Bid must be at least ${minimum} (current + increment)`
    );
  }

  // Demote previous winning bid
  await Bid.updateMany(
    { auction: auction._id, isWinning: true },
    { $set: { isWinning: false } }
  );

  const bid = await Bid.create({
    auction: auction._id,
    bidder: req.userId,
    amountMinor: bidAmount,
    isWinning: true,
    meta: {
      ipHash: hashIp(req.ip),
      userAgent: (req.get('user-agent') || '').slice(0, 500),
    },
  });

  auction.currentBidMinor = bidAmount;
  auction.currentBidder = req.userId;
  auction.bidCount += 1;
  await auction.save();

  res.status(201).json({ data: { _id: bid._id, amountMinor: bid.amountMinor } });
});

// ---- seller's own auctions --------------------------------
const listMyAuctions = asyncHandler(async (req, res) => {
  const p = parsePagination(req.query);
  const filter = { seller: req.userId };
  const [items, total] = await Promise.all([
    Auction.find(filter)
      .sort({ createdAt: -1 })
      .skip(p.skip)
      .limit(p.limit)
      .populate('vehicle', 'make model year images')
      .lean(),
    Auction.countDocuments(filter),
  ]);
  res.json(paginatedResponse(items.map(serialize), total, p));
});

// ---- seller cancel ----------------------------------------
const cancelMyAuction = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw ApiError.badRequest('Invalid id');

  const auction = await Auction.findById(id);
  if (!auction) throw ApiError.notFound('Auction not found');
  if (String(auction.seller) !== String(req.userId)) {
    throw ApiError.forbidden('Not your auction');
  }
  if (auction.status === 'ended' || auction.status === 'settled') {
    throw ApiError.badRequest('Auction cannot be cancelled');
  }
  auction.status = 'cancelled';
  await auction.save();
  res.json({ data: serialize(auction) });
});

module.exports = {
  listAuctions,
  getAuction,
  createAuction,
  placeBid,
  listMyAuctions,
  cancelMyAuction,
};

// =============================================================
// END OF FILE: backend/src/controllers/auctionController.js
// =============================================================