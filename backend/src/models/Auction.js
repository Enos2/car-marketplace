// =============================================================
// FILE: backend/src/models/Auction.js
// =============================================================
// Purpose:
//   A vehicle submitted for auction. Tracked independently from
//   the Vehicle listing so a car can be both listed for sale and
//   run through auction without conflicts.
//
// Lifecycle:
//   draft → pending (submitted) → live → ended → settled
//                              ↘ rejected / cancelled
// =============================================================

'use strict';

const mongoose = require('mongoose');

const { Schema } = mongoose;

const STATUS = [
  'draft',
  'pending',
  'live',
  'ended',
  'settled',
  'rejected',
  'cancelled',
];

const auctionSchema = new Schema(
  {
    // Who's running the auction (must own the vehicle)
    seller: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // Reference to the underlying vehicle (make, model, photos live here)
    vehicle: {
      type: Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
      index: true,
    },

    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, default: '', maxlength: 4000 },

    // Pricing — all in the same currency
    currency: { type: String, enum: ['KES', 'USD'], default: 'KES', required: true },
    startingBidMinor: { type: Number, required: true, min: 0 },
    reserveMinor: { type: Number, required: true, min: 0 }, // hidden
    minIncrementMinor: { type: Number, required: true, min: 0, default: 1000000 }, // 10k KES default
    buyNowMinor: { type: Number, min: 0 }, // optional

    // Schedule
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },

    // Current state
    status: { type: String, enum: STATUS, default: 'draft', index: true },

    // Rolling stats
    currentBidMinor: { type: Number, default: 0, min: 0 },
    currentBidder: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    bidCount: { type: Number, default: 0 },

    // Winner after end
    winner: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    settledAt: { type: Date, default: null },

    // Moderation
    moderation: {
      reviewedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
      reviewedAt: { type: Date, default: null },
      reason: { type: String, trim: true, default: '' },
    },

    // Soft delete
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false }
);

auctionSchema.index({ status: 1, endsAt: 1 });
auctionSchema.index({ status: 1, startsAt: 1 });
auctionSchema.index({ seller: 1, createdAt: -1 });

auctionSchema.pre(/^find/, function excludeDeleted() {
  if (!this.getOptions().includeDeleted) {
    this.where({ deletedAt: null });
  }
});

const Auction = mongoose.model('Auction', auctionSchema);
Auction.STATUS = STATUS;

module.exports = Auction;

// =============================================================
// END OF FILE: backend/src/models/Auction.js
// =============================================================