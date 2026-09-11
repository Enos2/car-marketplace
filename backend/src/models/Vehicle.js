// =============================================================
// FILE: backend/src/models/Vehicle.js
// =============================================================
// Purpose:
//   Mongoose schema for a vehicle listing (spec §6).
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
    storageKey: { type: String, required: true },
    url: { type: String, required: true },
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
    seller: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

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

    priceAmount: { type: Number, required: true, min: 0, index: true },
    priceCurrency: {
      type: String,
      required: true,
      enum: ['KES', 'USD'],
      default: 'KES',
    },
    negotiable: { type: Boolean, default: false },

    mileage: { type: Number, required: true, min: 0 },
    mileageUnit: { type: String, enum: ['km', 'mi'], default: 'km' },

    condition: { type: String, enum: CONDITION, default: 'used' },
    bodyType: { type: String, enum: BODY_TYPE, default: 'sedan', index: true },
    fuelType: { type: String, enum: FUEL_TYPE, default: 'petrol', index: true },
    transmission: { type: String, enum: TRANSMISSION, default: 'automatic' },

    location: {
      country: { type: String, default: 'Kenya', trim: true },
      county: { type: String, trim: true, default: '', index: true },
      city: { type: String, trim: true, default: '' },
    },

    description: { type: String, trim: true, default: '', maxlength: 5000 },
    features: { type: [String], default: [] },

    images: { type: [vehicleImageSchema], default: [] },

    status: { type: String, enum: STATUS, default: 'draft', index: true },

    // Admin curation flag (spec §10 "Manage featured listings").
    featured: { type: Boolean, default: false, index: true },

    moderation: {
      reviewedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
      reviewedAt: { type: Date, default: null },
      reason: { type: String, trim: true, default: '' },
    },

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

vehicleSchema.index({
  make: 'text',
  model: 'text',
  trim: 'text',
  description: 'text',
});

vehicleSchema.index({ status: 1, publishedAt: -1 });
vehicleSchema.index({ status: 1, featured: 1, publishedAt: -1 });
vehicleSchema.index({ status: 1, make: 1, model: 1 });
vehicleSchema.index({ status: 1, 'location.county': 1 });
vehicleSchema.index({ status: 1, priceAmount: 1 });

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