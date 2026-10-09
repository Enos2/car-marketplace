// =============================================================
// FILE: backend/src/models/Bid.js
// =============================================================
// Purpose:
//   Every bid placed on an auction. Append-only — bids are never
//   edited. Immutable price and timestamp.
// =============================================================

'use strict';

const mongoose = require('mongoose');

const { Schema } = mongoose;

const bidSchema = new Schema(
  {
    auction: {
      type: Schema.Types.ObjectId,
      ref: 'Auction',
      required: true,
      index: true,
    },
    bidder: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amountMinor: { type: Number, required: true, min: 0 },

    // Only the latest bid per auction has isWinning=true.
    isWinning: { type: Boolean, default: false, index: true },

    // IP + agent for audit only
    meta: {
      ipHash: { type: String, default: '' },
      userAgent: { type: String, default: '', maxlength: 500 },
    },
  },
  { timestamps: true, versionKey: false }
);

bidSchema.index({ auction: 1, amountMinor: -1 });
bidSchema.index({ auction: 1, createdAt: -1 });

module.exports = mongoose.model('Bid', bidSchema);

// =============================================================
// END OF FILE: backend/src/models/Bid.js
// =============================================================