// =============================================================
// FILE: backend/src/controllers/adminController.js
// =============================================================
// Purpose:
//   Admin moderation endpoints (spec §10). Every write action
//   is recorded in AuditLog.
// =============================================================

'use strict';

const mongoose = require('mongoose');
const Vehicle = require('../models/Vehicle');
const User = require('../models/User');
const Report = require('../models/Report');
const Inquiry = require('../models/Inquiry');
const AuditLog = require('../models/AuditLog');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { parsePagination, paginatedResponse } = require('../utils/pagination');

async function writeAudit(req, action, targetType, targetId, metadata = {}) {
  await AuditLog.create({
    actor: req.userId,
    action,
    targetType,
    targetId,
    metadata,
    ip: req.ip,
    userAgent: req.get('user-agent') || '',
  });
}

// ---------- dashboard ----------------------------------------

const dashboard = asyncHandler(async (req, res) => {
  const [pending, published, sold, users, openReports, newInquiries] = await Promise.all([
    Vehicle.countDocuments({ status: 'pending' }),
    Vehicle.countDocuments({ status: 'published' }),
    Vehicle.countDocuments({ status: 'sold' }),
    User.countDocuments({ status: 'active' }),
    Report.countDocuments({ status: 'open' }),
    Inquiry.countDocuments({ status: 'new' }),
  ]);
  res.json({
    data: { pending, published, sold, users, openReports, newInquiries },
  });
});

// ---------- listings -----------------------------------------

const listListings = asyncHandler(async (req, res) => {
  const p = parsePagination(req.query);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.q) {
    filter.$or = [
      { make: new RegExp(req.query.q, 'i') },
      { model: new RegExp(req.query.q, 'i') },
    ];
  }

  const [items, total] = await Promise.all([
    Vehicle.find(filter)
      .sort({ createdAt: -1 })
      .skip(p.skip)
      .limit(p.limit)
      .populate('seller', 'name email role')
      .lean(),
    Vehicle.countDocuments(filter),
  ]);
  res.json(paginatedResponse(items, total, p));
});

const moderateVehicle = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { action, reason } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) throw ApiError.badRequest('Invalid id');

  const vehicle = await Vehicle.findById(id);
  if (!vehicle) throw ApiError.notFound('Vehicle not found');

  switch (action) {
    case 'approve':
      vehicle.status = 'published';
      vehicle.publishedAt = new Date();
      break;
    case 'reject':
      vehicle.status = 'rejected';
      break;
    case 'remove':
      vehicle.status = 'removed';
      vehicle.deletedAt = new Date();
      break;
    case 'feature':
    case 'unfeature':
      // Reserved for a future `featured` flag; logged only.
      break;
    default:
      throw ApiError.badRequest('Unknown action');
  }

  vehicle.moderation = {
    reviewedBy: req.userId,
    reviewedAt: new Date(),
    reason: reason || '',
  };

  await vehicle.save();
  await writeAudit(req, `vehicle.${action}`, 'vehicle', vehicle._id, { reason });

  res.json({ data: vehicle });
});

// ---------- users --------------------------------------------

const listUsers = asyncHandler(async (req, res) => {
  const p = parsePagination(req.query);
  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.status) filter.status = req.query.status;

  const [items, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(p.skip).limit(p.limit).lean(),
    User.countDocuments(filter),
  ]);
  res.json(paginatedResponse(items, total, p));
});

const setUserStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, reason } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) throw ApiError.badRequest('Invalid id');
  if (String(id) === String(req.userId)) {
    throw ApiError.badRequest('Cannot change your own status');
  }

  const user = await User.findById(id);
  if (!user) throw ApiError.notFound('User not found');

  user.status = status;
  await user.save();

  await writeAudit(req, `user.${status === 'suspended' ? 'suspend' : 'reactivate'}`, 'user', user._id, {
    reason,
  });

  res.json({ data: user.toJSON() });
});

// ---------- reports ------------------------------------------

const listReports = asyncHandler(async (req, res) => {
  const p = parsePagination(req.query);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;

  const [items, total] = await Promise.all([
    Report.find(filter).sort({ createdAt: -1 }).skip(p.skip).limit(p.limit).lean(),
    Report.countDocuments(filter),
  ]);
  res.json(paginatedResponse(items, total, p));
});

const resolveReport = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;

  const report = await Report.findById(id);
  if (!report) throw ApiError.notFound('Report not found');

  report.status = status;
  report.resolution = {
    handledBy: req.userId,
    handledAt: new Date(),
    notes: notes || '',
  };
  await report.save();

  await writeAudit(req, `report.${status}`, 'report', report._id, { notes });
  res.json({ data: report });
});

// ---------- audit log ----------------------------------------

const listAuditLogs = asyncHandler(async (req, res) => {
  const p = parsePagination(req.query);
  const [items, total] = await Promise.all([
    AuditLog.find({})
      .sort({ createdAt: -1 })
      .skip(p.skip)
      .limit(p.limit)
      .populate('actor', 'name email role')
      .lean(),
    AuditLog.countDocuments({}),
  ]);
  res.json(paginatedResponse(items, total, p));
});

module.exports = {
  dashboard,
  listListings,
  moderateVehicle,
  listUsers,
  setUserStatus,
  listReports,
  resolveReport,
  listAuditLogs,
};

// =============================================================
// END OF FILE: backend/src/controllers/adminController.js
// =============================================================