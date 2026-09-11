// =============================================================
// FILE: backend/src/controllers/vehicleController.js
// =============================================================
// Purpose:
//   Vehicle listing endpoints. Public reads (list, detail),
//   seller-scoped writes (create, update, delete, submit),
//   image upload/delete, favorite toggle.
// =============================================================

'use strict';

const mongoose = require('mongoose');
const Vehicle = require('../models/Vehicle');
const Favorite = require('../models/Favorite');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { parsePagination, paginatedResponse } = require('../utils/pagination');
const imageService = require('../services/imageService');

// ---------- helpers ------------------------------------------
function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildPublicFilter(query) {
  const filter = { status: 'published' };

  if (query.make) filter.make = new RegExp(`^${escapeRegex(query.make)}$`, 'i');
  if (query.model) filter.model = new RegExp(`^${escapeRegex(query.model)}$`, 'i');
  if (query.bodyType) filter.bodyType = query.bodyType;
  if (query.fuelType) filter.fuelType = query.fuelType;
  if (query.transmission) filter.transmission = query.transmission;
  if (query.condition) filter.condition = query.condition;
  if (query.county) filter['location.county'] = query.county;

  if (query.minYear || query.maxYear) {
    filter.year = {};
    if (query.minYear) filter.year.$gte = parseInt(query.minYear, 10);
    if (query.maxYear) filter.year.$lte = parseInt(query.maxYear, 10);
  }
  if (query.minPrice || query.maxPrice) {
    filter.priceAmount = {};
    if (query.minPrice) filter.priceAmount.$gte = parseInt(query.minPrice, 10);
    if (query.maxPrice) filter.priceAmount.$lte = parseInt(query.maxPrice, 10);
  }
  if (query.minMileage || query.maxMileage) {
    filter.mileage = {};
    if (query.minMileage) filter.mileage.$gte = parseInt(query.minMileage, 10);
    if (query.maxMileage) filter.mileage.$lte = parseInt(query.maxMileage, 10);
  }
  return filter;
}

function buildSort(query) {
  const map = {
    newest: { publishedAt: -1, createdAt: -1 },
    'price-asc': { priceAmount: 1 },
    'price-desc': { priceAmount: -1 },
    mileage: { mileage: 1 },
  };
  return map[query.sort] || map.newest;
}

// ---------- public reads -------------------------------------

const listVehicles = asyncHandler(async (req, res) => {
  const p = parsePagination(req.query);
  const filter = buildPublicFilter(req.query);
  const sort = buildSort(req.query);

  if (req.query.q) {
    filter.$text = { $search: req.query.q };
  }

  const [items, total] = await Promise.all([
    Vehicle.find(filter)
      .sort(sort)
      .skip(p.skip)
      .limit(p.limit)
      .populate('seller', 'name role verificationStatus')
      .lean(),
    Vehicle.countDocuments(filter),
  ]);

  res.json(paginatedResponse(items, total, p));
});

const getVehicleById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw ApiError.badRequest('Invalid id');

  const vehicle = await Vehicle.findOne({ _id: id, status: 'published' })
    .populate('seller', 'name role verificationStatus')
    .lean();
  if (!vehicle) throw ApiError.notFound('Vehicle not found');

  Vehicle.updateOne({ _id: id }, { $inc: { 'stats.views': 1 } }).catch(() => {});

  res.json({ data: vehicle });
});

// ---------- seller writes ------------------------------------

const createVehicle = asyncHandler(async (req, res) => {
  const payload = {
    ...req.body,
    seller: req.userId,
    status: 'draft',
  };
  const vehicle = await Vehicle.create(payload);
  res.status(201).json({ data: vehicle });
});

const updateVehicle = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const vehicle = await Vehicle.findById(id);
  if (!vehicle) throw ApiError.notFound('Vehicle not found');
  if (String(vehicle.seller) !== String(req.userId) && req.user.role !== 'admin') {
    throw ApiError.forbidden('Not your listing');
  }

  delete req.body.status;
  Object.assign(vehicle, req.body);
  await vehicle.save();
  res.json({ data: vehicle });
});

const deleteVehicle = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const vehicle = await Vehicle.findById(id);
  if (!vehicle) throw ApiError.notFound('Vehicle not found');
  if (String(vehicle.seller) !== String(req.userId) && req.user.role !== 'admin') {
    throw ApiError.forbidden('Not your listing');
  }

  for (const img of vehicle.images) {
    await imageService.deleteVehicleImage(img.storageKey);
  }

  vehicle.deletedAt = new Date();
  vehicle.status = 'removed';
  await vehicle.save();
  res.json({ ok: true });
});

const submitForReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const vehicle = await Vehicle.findById(id);
  if (!vehicle) throw ApiError.notFound('Vehicle not found');
  if (String(vehicle.seller) !== String(req.userId)) {
    throw ApiError.forbidden('Not your listing');
  }
  if (vehicle.status !== 'draft' && vehicle.status !== 'rejected') {
    throw ApiError.badRequest('Listing cannot be submitted in its current state');
  }
  if (!vehicle.images || vehicle.images.length === 0) {
    throw ApiError.badRequest('Add at least one image before submitting');
  }

  vehicle.status = 'pending';
  await vehicle.save();
  res.json({ data: vehicle });
});

// ---------- images -------------------------------------------

const uploadImages = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const vehicle = await Vehicle.findById(id);
  if (!vehicle) throw ApiError.notFound('Vehicle not found');
  if (String(vehicle.seller) !== String(req.userId)) {
    throw ApiError.forbidden('Not your listing');
  }
  if (!req.files || req.files.length === 0) {
    throw ApiError.badRequest('No files uploaded');
  }

  const processed = [];
  for (const file of req.files) {
    const info = await imageService.processVehicleImage(file.buffer, file.mimetype);
    processed.push(info);
  }

  const startOrder = vehicle.images.length;
  const toAdd = processed.map((p, i) => ({
    storageKey: p.storageKey,
    url: p.url,
    width: p.width,
    height: p.height,
    sizeBytes: p.sizeBytes,
    mimeType: p.mimeType,
    isPrimary: vehicle.images.length === 0 && i === 0,
    order: startOrder + i,
  }));

  vehicle.images.push(...toAdd);
  await vehicle.save();
  res.status(201).json({ data: vehicle.images });
});

const deleteImage = asyncHandler(async (req, res) => {
  const { id, imageId } = req.params;
  const vehicle = await Vehicle.findById(id);
  if (!vehicle) throw ApiError.notFound('Vehicle not found');
  if (String(vehicle.seller) !== String(req.userId)) {
    throw ApiError.forbidden('Not your listing');
  }

  const img = vehicle.images.id(imageId);
  if (!img) throw ApiError.notFound('Image not found');

  await imageService.deleteVehicleImage(img.storageKey);
  const wasPrimary = img.isPrimary;
  img.deleteOne();

  if (wasPrimary && vehicle.images.length > 0) {
    vehicle.images[0].isPrimary = true;
  }

  await vehicle.save();
  res.json({ data: vehicle.images });
});

// ---------- favorites ----------------------------------------

const toggleFavorite = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const vehicle = await Vehicle.findById(id).select('_id');
  if (!vehicle) throw ApiError.notFound('Vehicle not found');

  const existing = await Favorite.findOne({ user: req.userId, vehicle: id });
  if (existing) {
    await existing.deleteOne();
    await Vehicle.updateOne({ _id: id }, { $inc: { 'stats.favorites': -1 } });
    return res.json({ favorited: false });
  }

  await Favorite.create({ user: req.userId, vehicle: id });
  await Vehicle.updateOne({ _id: id }, { $inc: { 'stats.favorites': 1 } });
  res.json({ favorited: true });
});

module.exports = {
  listVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  submitForReview,
  uploadImages,
  deleteImage,
  toggleFavorite,
};

// =============================================================
// END OF FILE: backend/src/controllers/vehicleController.js
// =============================================================