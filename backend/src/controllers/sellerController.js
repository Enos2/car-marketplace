// =============================================================
// FILE: backend/src/controllers/sellerController.js
// =============================================================
// Purpose:
//   Public seller profile reads + own profile update + seller
//   dashboard analytics (spec §9).
// =============================================================

'use strict';

const mongoose = require('mongoose');
const User = require('../models/User');
const SellerProfile = require('../models/SellerProfile');
const Vehicle = require('../models/Vehicle');
const Inquiry = require('../models/Inquiry');
const Viewing = require('../models/Viewing');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { parsePagination, paginatedResponse } = require('../utils/pagination');

// -------- public reads ---------------------------------------

const getPublicSeller = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw ApiError.badRequest('Invalid id');

  const user = await User.findById(id)
    .select('name role verificationStatus contactPreferences')
    .lean();
  if (!user || user.role !== 'seller') throw ApiError.notFound('Seller not found');

  const profile = await SellerProfile.findOne({ user: id }).lean();
  if (!profile) throw ApiError.notFound('Seller profile not found');

  const cp = user.contactPreferences || {};

  res.json({
    data: {
      id: user._id,
      name: user.name,
      role: user.role,
      verificationStatus: user.verificationStatus,
      sellerType: profile.sellerType,
      businessName: profile.businessName,
      about: profile.about,
      location: profile.location,
      publicEmail: cp.showEmail ? profile.publicEmail : '',
      publicPhone: cp.showPhone ? profile.publicPhone : '',
      whatsappEnabled: !!cp.whatsappEnabled,
    },
  });
});

const getPublicSellerVehicles = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const p = parsePagination(req.query);

  const filter = { seller: id, status: 'published' };
  const [items, total] = await Promise.all([
    Vehicle.find(filter).sort({ publishedAt: -1 }).skip(p.skip).limit(p.limit).lean(),
    Vehicle.countDocuments(filter),
  ]);
  res.json(paginatedResponse(items, total, p));
});

// -------- own profile ----------------------------------------

const getMyProfile = asyncHandler(async (req, res) => {
  const profile = await SellerProfile.findOne({ user: req.userId }).lean();
  res.json({ data: profile || null });
});

const updateMyProfile = asyncHandler(async (req, res) => {
  const allowed = ['sellerType', 'businessName', 'location', 'about', 'publicEmail', 'publicPhone'];
  const update = {};
  for (const k of allowed) {
    if (req.body[k] !== undefined) update[k] = req.body[k];
  }

  const profile = await SellerProfile.findOneAndUpdate(
    { user: req.userId },
    { $set: update },
    { new: true, upsert: true }
  );

  if (req.body.contactPreferences && typeof req.body.contactPreferences === 'object') {
    const cp = req.body.contactPreferences;
    const cpAllowed = [
      'allowEnquiries',
      'showEmail',
      'showPhone',
      'whatsappEnabled',
      'emailNotifications',
    ];
    const cpUpdate = {};
    for (const k of cpAllowed) {
      if (cp[k] !== undefined) cpUpdate[`contactPreferences.${k}`] = !!cp[k];
    }
    if (Object.keys(cpUpdate).length > 0) {
      await User.updateOne({ _id: req.userId }, { $set: cpUpdate });
    }
  }

  res.json({ data: profile });
});

// -------- dashboard analytics (spec §9) ----------------------

const getMyStats = asyncHandler(async (req, res) => {
  const sellerId = req.userId;

  // Counts by listing status
  const [
    totalListings,
    drafts,
    pending,
    published,
    sold,
    totalViewsResult,
    totalFavoritesResult,
    totalEnquiries,
    totalViewings,
    pendingViewings,
  ] = await Promise.all([
    Vehicle.countDocuments({ seller: sellerId }),
    Vehicle.countDocuments({ seller: sellerId, status: 'draft' }),
    Vehicle.countDocuments({ seller: sellerId, status: 'pending' }),
    Vehicle.countDocuments({ seller: sellerId, status: 'published' }),
    Vehicle.countDocuments({ seller: sellerId, status: 'sold' }),
    Vehicle.aggregate([
      { $match: { seller: new mongoose.Types.ObjectId(sellerId) } },
      { $group: { _id: null, total: { $sum: '$stats.views' } } },
    ]),
    Vehicle.aggregate([
      { $match: { seller: new mongoose.Types.ObjectId(sellerId) } },
      { $group: { _id: null, total: { $sum: '$stats.favorites' } } },
    ]),
    Inquiry.countDocuments({ seller: sellerId }),
    Viewing.countDocuments({ seller: sellerId }),
    Viewing.countDocuments({
      seller: sellerId,
      bookingStatus: { $nin: ['completed', 'cancelled-by-buyer', 'cancelled-by-seller', 'cancelled-by-admin'] },
    }),
  ]);

  // Top 5 most-viewed listings
  const topListings = await Vehicle.find({ seller: sellerId })
    .sort({ 'stats.views': -1 })
    .limit(5)
    .select('make model year priceAmount priceCurrency stats images status')
    .lean();

  // Recent enquiries (last 5)
  const recentEnquiries = await Inquiry.find({ seller: sellerId })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('vehicle', 'make model year')
    .lean();

  res.json({
    data: {
      listings: {
        total: totalListings,
        draft: drafts,
        pending,
        published,
        sold,
      },
      engagement: {
        views: totalViewsResult[0]?.total || 0,
        favorites: totalFavoritesResult[0]?.total || 0,
        enquiries: totalEnquiries,
      },
      viewings: {
        total: totalViewings,
        active: pendingViewings,
      },
      topListings,
      recentEnquiries,
    },
  });
});

module.exports = {
  getPublicSeller,
  getPublicSellerVehicles,
  getMyProfile,
  updateMyProfile,
  getMyStats,
};

// =============================================================
// END OF FILE: backend/src/controllers/sellerController.js
// =============================================================