// =============================================================
// FILE: backend/src/services/receiptAccessService.js
// =============================================================
// Purpose:
//   Append-only audit writer for receipt access (§B.1).
// =============================================================

'use strict';

const ReceiptAccessLog = require('../models/ReceiptAccessLog');

async function record({ adminId, viewingId, receiptId, action, ip, userAgent }) {
  if (!adminId || !viewingId || !receiptId || !action) {
    throw new Error('receiptAccessService.record: missing required fields');
  }
  await ReceiptAccessLog.create({
    admin: adminId,
    viewing: viewingId,
    receiptId,
    action,
    timestamp: new Date(),
    ip: ip || '',
    userAgent: userAgent ? String(userAgent).slice(0, 500) : '',
  });
}

module.exports = { record };

// =============================================================
// END OF FILE: backend/src/services/receiptAccessService.js
// =============================================================