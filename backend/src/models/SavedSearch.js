// =============================================================
// FILE: backend/src/models/SavedSearch.js
// =============================================================
// Purpose:
//   A saved filter set belonging to a user (spec §12). Stores
//   the FILTERS, not the result list — results are recomputed
//   at query time, so a saved search never goes stale.
//
// Notes:
//   - Filters stored as a Mixed object because the shape mirrors
//     the vehicle list query params, which will grow.
//   - name is user-supplied so they can label their searches.
//   - notifyOnMatch reserved for the future notification engine
//     (spec §12 optional). Not wired to anything yet.
// =============================================================

'use strict';

const mongoose = require('mongoose');

const { Schema } = mongoose;

const savedSearchSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    // The filter set — mirrors vehicle list query params.
    filters: {
      type: Schema.Types.Mixed,
      required: true,
      default: {},
    },

    // Reserved for future notification delivery (spec §12, §21).
    notifyOnMatch: {
      type: Boolean,
      default: false,
    },

    lastNotifiedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

savedSearchSchema.index({ user: 1, createdAt: -1 });

// Expose a small allowlist of filter keys so unexpected fields
// never end up stored on the document.
savedSearchSchema.statics.ALLOWED_FILTER_KEYS = [
  'q',
  'make',
  'model',
  'bodyType',
  'fuelType',
  'transmission',
  'condition',
  'county',
  'minPrice',
  'maxPrice',
  'minYear',
  'maxYear',
  'minMileage',
  'maxMileage',
  'sort',
];

module.exports = mongoose.model('SavedSearch', savedSearchSchema);

// =============================================================
// END OF FILE: backend/src/models/SavedSearch.js
// =============================================================