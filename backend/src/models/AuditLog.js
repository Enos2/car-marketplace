// =============================================================
// FILE: backend/src/models/AuditLog.js
// =============================================================
// Purpose:
//   Immutable trail of privileged actions (spec §10, §27).
//   Written by services when significant admin/seller actions
//   occur. Never updated, never deleted.
// =============================================================

'use strict';

const mongoose = require('mongoose');

const { Schema } = mongoose;

const auditLogSchema = new Schema(
  {
    actor: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    action: { type: String, required: true, index: true }, // e.g. 'vehicle.approve'
    targetType: { type: String, required: true },          // 'vehicle' | 'user' | 'inquiry'
    targetId: { type: Schema.Types.ObjectId, default: null, index: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
    ip: { type: String, default: '' },
    userAgent: { type: String, default: '' },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  }
);

auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);

// =============================================================
// END OF FILE: backend/src/models/AuditLog.js
// =============================================================