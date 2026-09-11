// =============================================================
// FILE: backend/src/models/Vehicle.js
// =============================================================
// Purpose:
//   Mongoose schema for a vehicle listing (spec §6).
//
// Monetary handling:
//   priceAmount is an INTEGER in MINOR units (KES cents, USD
//   cents). priceCurrency stores the original currency. Never
//   convert on write; conversion is a display concern.
//
// Image handling:
//   image references are stored as subdocuments with a server-
//   generated storage key. Original filenames are never used
//   as paths (spec §7, §18).
// =============================================================

'use strict';

const mongoose = require('mongoose');

const { Schema } = mongoose;

const CONDITION = ['new', 'used', 'certified'];
const BODY_TYPE = [
  'sedan', 'suv', 'hatchback', 'pickup', 'van',
  'coupe', 'wagon', 'convertible', 'motorcycle', 'other',
];
const FUEL_TYPE = ['petrol', 'diesel', 'hybrid', 'plug-in-hybrid', 'electric', 'other'];
const TRANSMISSION = ['automatic', 'manual', 'cvt', 'other'];
const STATUS = [
  'draft', 'pending', 'approved', 'published',
  'reserved', 'sold', 'rejected', 'removed',
];

const vehicleImageSchema = new Schema(
  {
    storageKey: { type: String, required: true }, // random key, not original filename
    url: { type: String, required: true },        // public URL
    width: { type: Number, default: 0 },
    height: { type: Number, default: 0 },
    sizeBytes: { type: Number, default: 0 },
    mimeType: { type: String, default: '' },
    isPrimary: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  { _id: true, timestamps: false }
);

const vehicleSchema = new Schema(
  {
    // ----- Owner ----------------------------------------------
    seller: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // ----- Identification -------------------------------------
    make: { type: String, required: true, trim: true, index: true },
    model: { type: String, required: true, trim: true, index: true },
    trim: { type: String, trim: true, default: '' },
    year: {
      type: Number,
      required: true,
      min: 1950,
      max: new Date().getFullYear() + 1,
      index: true,
    },

    // ----- Pricing (original currency, minor units) -----------
    priceAmount: { type: Number, required: true, min: 0, index: true },
    priceCurrency: {
      type: String,
      required: true,
      enum: ['KES', 'USD'],
      default: 'KES',
    },
    negotiable: { type: Boolean, default: false },

    // ----- Usage ----------------------------------------------
    mileage: { type: Number, required: true, min: 0 },
    mileageUnit: { type: String, enum: ['km', 'mi'], default: 'km' },

    // ----- Classification -------------------------------------
    condition: { type: String, enum: CONDITION, default: 'used' },
    bodyType: { type: String, enum: BODY_TYPE, default: 'sedan', index: true },
    fuelType: { type: String, enum: FUEL_TYPE, default: 'petrol', index: true },
    transmission: { type: String, enum: TRANSMISSION, default: 'automatic' },

    // ----- Location -------------------------------------------
    location: {
      country: { type: String, default: 'Kenya', trim: true },
      county: { type: String, trim: true, default: '', index: true },
      city: { type: String, trim: true, default: '' },
    },

    // ----- Content --------------------------------------------
    description: { type: String, trim: true, default: '', maxlength: 5000 },
    features: { type: [String], default: [] },

    // ----- Images ---------------------------------------------
    images: { type: [vehicleImageSchema], default: [] },

    // ----- Lifecycle / moderation -----------------------------
    status: { type: String, enum: STATUS, default: 'draft', index: true },

    moderation: {
      reviewedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
      reviewedAt: { type: Date, default: null },
      reason: { type: String, trim: true, default: '' }, // internal only
    },

    // Denormalized counters for feed + sort performance
    stats: {
      views: { type: Number, default: 0 },
      favorites: { type: Number, default: 0 },
      enquiries: { type: Number, default: 0 },
    },

    publishedAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Text index for keyword search (spec §11)
vehicleSchema.index({
  make: 'text',
  model: 'text',
  trim: 'text',
  description: 'text',
});

// Feed: newest published
vehicleSchema.index({ status: 1, publishedAt: -1 });

// Filter combinations
vehicleSchema.index({ status: 1, make: 1, model: 1 });
vehicleSchema.index({ status: 1, 'location.county': 1 });
vehicleSchema.index({ status: 1, priceAmount: 1 });

// Soft-delete filter — Mongoose 8 syntax
vehicleSchema.pre(/^find/, function excludeDeleted() {
  if (!this.getOptions().includeDeleted) {
    this.where({ deletedAt: null });
  }
});

const Vehicle = mongoose.model('Vehicle', vehicleSchema);
Vehicle.CONDITION = CONDITION;
Vehicle.BODY_TYPE = BODY_TYPE;
Vehicle.FUEL_TYPE = FUEL_TYPE;
Vehicle.TRANSMISSION = TRANSMISSION;
Vehicle.STATUS = STATUS;

module.exports = Vehicle;

// =============================================================
// END OF FILE: backend/src/models/Vehicle.js
// =============================================================