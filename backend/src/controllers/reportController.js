// =============================================================
// FILE: backend/src/controllers/reportController.js
// =============================================================
// Purpose:
//   Buyer-facing report creation (spec §5, §20). Admins already
//   have list + resolve endpoints in adminController.js; this
//   only adds the create endpoint that ordinary users hit.
//
// Notes:
//   - Reports are anonymous-friendly: a signed-in buyer's user
//     id is recorded, but the endpoint doesn't require auth so
//     a guest can flag a fraudulent listing too.
//   - Rate-limited at the route level.
// =============================================================

'use strict';

const mongoose = require('mongoose');
const Report = require('../models/Report');
const Vehicle = require('../models/Vehicle');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

const createReport = asyncHandler(async (req, res) => {
  const { targetType, targetId, reason, details } = req.body;

  if (!['vehicle', 'user'].includes(targetType)) {
    throw ApiError.badRequest('targetType must be vehicle or user');
  }
  if (!mongoose.Types.ObjectId.isValid(targetId)) {
    throw ApiError.badRequest('Invalid targetId');
  }

  // Verify the target exists before recording a report against it.
  if (targetType === 'vehicle') {
    const exists = await Vehicle.exists({ _id: targetId });
    if (!exists) throw ApiError.notFound('Vehicle not found');
  } else {
    const exists = await User.exists({ _id: targetId });
    if (!exists) throw ApiError.notFound('User not found');
  }

  const report = await Report.create({
    targetType,
    targetId,
    reportedBy: req.userId || null,
    reason,
    details: details || '',
  });

  res.status(201).json({
    data: {
      _id: report._id,
      targetType: report.targetType,
      targetId: report.targetId,
      reason: report.reason,
      status: report.status,
    },
  });
});

module.exports = { createReport };

// =============================================================
// END OF FILE: backend/src/controllers/reportController.js
// =============================================================