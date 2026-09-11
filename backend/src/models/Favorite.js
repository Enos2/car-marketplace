// =============================================================
// FILE: backend/src/models/Favorite.js
// =============================================================
// Purpose:
//   Server-side favorite (spec §12). Stored per user so it works
//   across devices. Compound unique index prevents duplicates.
// =============================================================

'use strict';

const mongoose = require('mongoose');

const { Schema } = mongoose;

const favoriteSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    vehicle: {
      type: Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

favoriteSchema.index({ user: 1, vehicle: 1 }, { unique: true });

module.exports = mongoose.model('Favorite', favoriteSchema);

// =============================================================
// END OF FILE: backend/src/models/Favorite.js
// =============================================================