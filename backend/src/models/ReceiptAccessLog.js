// =============================================================
// FILE: backend/src/models/ReceiptAccessLog.js
// =============================================================
// Purpose:
//   Append-only audit of every read and mark-viewed action on a
//   receipt (§B.1 of the addendum). Lets us distinguish "admin
//   opened and read the receipt" from "something touched the
//   endpoint."
//
// Notes:
//   - Never updated, never deleted through the API.
//   - Deletion, if ever needed, is a break-glass operation
//     outside the application.
// =============================================================

'use strict';

const mongoose = require('mongoose');

const { Schema } = mongoose;

const ACTIONS = ['view', 'mark_viewed'];

const receiptAccessLogSchema = new Schema(
  {
    admin: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    viewing: { type: Schema.Types.ObjectId, ref: 'Viewing', required: true, index: true },
    receiptId: { type: String, required: true, index: true },
    action: { type: String, enum: ACTIONS, required: true },
    timestamp: { type: Date, required: true, default: Date.now },
    ip: { type: String, default: '' },
    userAgent: { type: String, default: '', maxlength: 500 },
  },
  {
    timestamps: false,
    versionKey: false,
    // Prevent accidental updates via Mongoose: strip update methods.
    strict: true,
  }
);

receiptAccessLogSchema.index({ viewing: 1, timestamp: -1 });
receiptAccessLogSchema.index({ admin: 1, timestamp: -1 });

const ReceiptAccessLog = mongoose.model('ReceiptAccessLog', receiptAccessLogSchema);
ReceiptAccessLog.ACTIONS = ACTIONS;

module.exports = ReceiptAccessLog;

// =============================================================
// END OF FILE: backend/src/models/ReceiptAccessLog.js
// =============================================================