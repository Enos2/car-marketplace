// =============================================================
// FILE: backend/src/controllers/savedSearchController.js
// =============================================================
// Purpose:
//   Saved-search CRUD (spec §12). All routes require auth and
//   operate only on the current user's own searches.
// =============================================================

'use strict';

const mongoose = require('mongoose');
const SavedSearch = require('../models/SavedSearch');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { parsePagination, paginatedResponse } = require('../utils/pagination');

// Keep only allowed filter keys, drop anything else.
function sanitizeFilters(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {};
  const allowed = SavedSearch.ALLOWED_FILTER_KEYS;
  const out = {};
  for (const key of allowed) {
    if (input[key] !== undefined && input[key] !== null && input[key] !== '') {
      out[key] = input[key];
    }
  }
  return out;
}

// -------- POST /api/saved-searches --------------------------
const createSavedSearch = asyncHandler(async (req, res) => {
  const { name, filters, notifyOnMatch } = req.body;

  const doc = await SavedSearch.create({
    user: req.userId,
    name,
    filters: sanitizeFilters(filters),
    notifyOnMatch: !!notifyOnMatch,
  });

  res.status(201).json({ data: doc });
});

// -------- GET /api/saved-searches ---------------------------
const listMySavedSearches = asyncHandler(async (req, res) => {
  const p = parsePagination(req.query);
  const filter = { user: req.userId };

  const [items, total] = await Promise.all([
    SavedSearch.find(filter).sort({ createdAt: -1 }).skip(p.skip).limit(p.limit).lean(),
    SavedSearch.countDocuments(filter),
  ]);

  res.json(paginatedResponse(items, total, p));
});

// -------- GET /api/saved-searches/:id -----------------------
const getMySavedSearch = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw ApiError.badRequest('Invalid id');

  const doc = await SavedSearch.findOne({ _id: id, user: req.userId }).lean();
  if (!doc) throw ApiError.notFound('Saved search not found');

  res.json({ data: doc });
});

// -------- PATCH /api/saved-searches/:id ---------------------
const updateMySavedSearch = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw ApiError.badRequest('Invalid id');

  const doc = await SavedSearch.findOne({ _id: id, user: req.userId });
  if (!doc) throw ApiError.notFound('Saved search not found');

  if (typeof req.body.name === 'string') {
    doc.name = req.body.name.trim().slice(0, 100);
  }
  if (req.body.filters !== undefined) {
    doc.filters = sanitizeFilters(req.body.filters);
  }
  if (typeof req.body.notifyOnMatch === 'boolean') {
    doc.notifyOnMatch = req.body.notifyOnMatch;
  }

  await doc.save();
  res.json({ data: doc });
});

// -------- DELETE /api/saved-searches/:id --------------------
const deleteMySavedSearch = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw ApiError.badRequest('Invalid id');

  const doc = await SavedSearch.findOne({ _id: id, user: req.userId });
  if (!doc) throw ApiError.notFound('Saved search not found');

  await doc.deleteOne();
  res.json({ ok: true });
});

module.exports = {
  createSavedSearch,
  listMySavedSearches,
  getMySavedSearch,
  updateMySavedSearch,
  deleteMySavedSearch,
};

// =============================================================
// END OF FILE: backend/src/controllers/savedSearchController.js
// =============================================================