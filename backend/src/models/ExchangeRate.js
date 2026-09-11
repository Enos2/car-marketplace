// =============================================================
// FILE: backend/src/models/ExchangeRate.js
// =============================================================
// Purpose:
//   Cached exchange rate records (spec §2, §30). Rates are stored
//   with source, timestamp, and currency pair so we can audit
//   what rate a conversion used. The listing price is never
//   mutated by a rate change.
// =============================================================

'use strict';

const mongoose = require('mongoose');

const { Schema } = mongoose;

const exchangeRateSchema = new Schema(
  {
    base: { type: String, required: true, uppercase: true },   // e.g. USD
    target: { type: String, required: true, uppercase: true }, // e.g. KES

    // Store as string to avoid float drift; parse where used.
    rate: { type: String, required: true },

    source: { type: String, required: true }, // 'exchangerate.host' | 'fallback'
    sourceTimestamp: { type: Date, required: true },
    fetchedAt: { type: Date, default: Date.now },

    isFallback: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

exchangeRateSchema.index({ base: 1, target: 1, fetchedAt: -1 });

module.exports = mongoose.model('ExchangeRate', exchangeRateSchema);

// =============================================================
// END OF FILE: backend/src/models/ExchangeRate.js
// =============================================================