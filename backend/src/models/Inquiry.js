// =============================================================
// FILE: backend/src/models/Inquiry.js
// =============================================================
// Purpose:
//   Buyer enquiry tied to a specific vehicle (spec §8). Sellers
//   see enquiries in their dashboard; admins see all enquiries
//   in moderation views. Audit trail preserved.
// =============================================================

'use strict';

const mongoose = require('mongoose');

const { Schema } = mongoose;

const STATUS = ['new', 'contacted', 'in-progress', 'closed'];

const inquirySchema = new Schema(
  {
    vehicle: {
      type: Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
      index: true,
    },

    seller: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // Buyer may be anonymous (guest) or signed-in
    buyer: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true, default: '' },

    preferredContact: {
      type: String,
      enum: ['email', 'phone', 'whatsapp', 'any'],
      default: 'any',
    },

    message: { type: String, required: true, trim: true, maxlength: 2000 },

    status: { type: String, enum: STATUS, default: 'new', index: true },

    // Basic anti-spam metadata (never expose to sellers)
    meta: {
      ipHash: { type: String, default: '' },
      userAgent: { type: String, default: '' },
    },

    // Seller notes — internal
    sellerNotes: { type: String, trim: true, default: '' },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

inquirySchema.index({ seller: 1, status: 1, createdAt: -1 });
inquirySchema.index({ vehicle: 1, createdAt: -1 });

const Inquiry = mongoose.model('Inquiry', inquirySchema);
Inquiry.STATUS = STATUS;

module.exports = Inquiry;

// =============================================================
// END OF FILE: backend/src/models/Inquiry.js
// =============================================================