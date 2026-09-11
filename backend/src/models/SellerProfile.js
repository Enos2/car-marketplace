// =============================================================
// FILE: backend/src/models/SellerProfile.js
// =============================================================
// Purpose:
//   Extended profile for seller/dealer accounts. Publicly visible
//   fields (businessName, location, about) render on the seller
//   profile page (spec §5). Private fields are only used for
//   verification and admin review.
// =============================================================

'use strict';

const mongoose = require('mongoose');

const { Schema } = mongoose;

const sellerProfileSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },

    sellerType: {
      type: String,
      enum: ['private', 'dealer'],
      default: 'private',
    },

    businessName: { type: String, trim: true, default: '' },

    // Public location
    location: {
      country: { type: String, default: 'Kenya', trim: true },
      county: { type: String, trim: true, default: '' },
      city: { type: String, trim: true, default: '' },
    },

    // Public blurb
    about: { type: String, trim: true, default: '', maxlength: 2000 },

    // Public contact (only shown if user enables in contactPreferences)
    publicEmail: { type: String, trim: true, lowercase: true, default: '' },
    publicPhone: { type: String, trim: true, default: '' },

    // Private verification details
    verification: {
      businessRegNumber: { type: String, trim: true, default: '' },
      nationalId: { type: String, trim: true, default: '' },
      documents: { type: [String], default: [] },
      reviewedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
      reviewedAt: { type: Date, default: null },
      notes: { type: String, trim: true, default: '' },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model('SellerProfile', sellerProfileSchema);

// =============================================================
// END OF FILE: backend/src/models/SellerProfile.js
// =============================================================