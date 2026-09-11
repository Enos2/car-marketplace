// =============================================================
// FILE: backend/src/controllers/vehicleController.js
// =============================================================
// Purpose:
//   HTTP handlers for vehicle listing endpoints. Kept thin —
//   parse request → call model → shape response. No business
//   logic here that belongs in a service layer later.
//
// Endpoints handled:
//   GET /api/vehicles        → listVehicles
//   GET /api/vehicles/:id    → getVehicleById
// =============================================================

'use strict';

const mongoose = require('mongoose');
const Vehicle = require('../models/Vehicle');

/**
 * GET /api/vehicles
 * Returns a paginated list of published vehicles, newest first.
 * Query params:
 *   - limit  (default 24, max 100)
 *   - page   (default 1)
 */
async function listVehicles(req, res, next) {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 24, 100);
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const skip = (page - 1) * limit;

    const filter = { status: 'published' };

    const [items, total] = await Promise.all([
      Vehicle.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Vehicle.countDocuments(filter),
    ]);

    res.json({
      data: items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/vehicles/:id
 * Returns a single vehicle by ID.
 */
async function getVehicleById(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid vehicle id' });
    }

    const vehicle = await Vehicle.findOne({ _id: id, status: 'published' }).lean();

    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    res.json({ data: vehicle });
  } catch (err) {
    next(err);
  }
}

module.exports = { listVehicles, getVehicleById };

// =============================================================
// END OF FILE: backend/src/controllers/vehicleController.js
// =============================================================