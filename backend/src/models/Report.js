// =============================================================
// FILE: backend/src/models/Report.js
// =============================================================
// Purpose:
//   Buyer or admin report of a listing or user (spec §5, §20).
//   Reviewed in the admin moderation queue.
// =============================================================

'use strict';

const mongoose = require('mongoose');

const { Schema } = mongoose;

const REASONS = ['fraud', 'inaccurate', 'inappropriate', 'duplicate', 'other'];
const STATUS = ['open', 'reviewing', 'resolved', 'dismissed'];

const reportSchema = new Schema(
  {
    targetType: { type: String, enum: ['vehicle', 'user'], required: true },
    targetId: { type: Schema.Types.ObjectId, required: true, index: true },

    reportedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },

    reason: { type: String, enum: REASONS, required: true },
    details: { type: String, trim: true, default: '', maxlength: 2000 },

    status: { type: String, enum: STATUS, default: 'open', index: true },

    resolution: {
      handledBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
      handledAt: { type: Date, default: null },
      notes: { type: String, trim: true, default: '' },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

reportSchema.index({ status: 1, createdAt: -1 });

const Report = mongoose.model('Report', reportSchema);
Report.REASONS = REASONS;
Report.STATUS = STATUS;

module.exports = Report;

// =============================================================
// END OF FILE: backend/src/models/Report.js
// =============================================================