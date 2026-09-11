// =============================================================
// FILE: backend/src/services/receiptService.js
// =============================================================
// Purpose:
//   Generate the human-readable receipt for a viewing booking,
//   email it to the buyer, and initialize the receipt review
//   state machine (see §A.6 of the addendum).
//
// Design:
//   - The receipt is generated from authoritative backend data,
//     not from any client-supplied values.
//   - Email delivery status is recorded on the receipt.
//   - If email fails, the booking remains valid — the receipt
//     stays accessible in the system.
// =============================================================

'use strict';

const Viewing = require('../models/Viewing');
const emailService = require('./emailService');
const viewingStateMachine = require('./viewingStateMachine');
const logger = require('../utils/logger');

function formatMoneyMinor(amountMinor, currency) {
  const major = (amountMinor || 0) / 100;
  const symbol = currency === 'USD' ? '$' : 'KSh';
  return `${symbol} ${major.toLocaleString('en-KE', { maximumFractionDigits: 0 })}`;
}

/**
 * Build the plain-text receipt body. HTML can be added later.
 */
function buildReceiptText(viewing) {
  const lines = [
    'CAR MARKETPLACE — VIEWING RECEIPT',
    '=================================',
    '',
    `Reference:     ${viewing.reference}`,
    `Receipt No:    ${viewing.receipt.receiptNumber}`,
    `Issued:        ${viewing.receipt.generatedAt.toISOString()}`,
    '',
    'Buyer',
    `  Name:        ${viewing.buyerContact.name}`,
    `  Email:       ${viewing.buyerContact.email}`,
    viewing.buyerContact.phone ? `  Phone:       ${viewing.buyerContact.phone}` : null,
    '',
    'Appointment',
    `  Date:        ${viewing.date}`,
    `  Time:        ${viewing.startTime} – ${viewing.endTime}`,
    `  Location:    ${viewing.location}`,
    `  Duration:    ${viewing.durationMinutes} minutes`,
    '',
    'Payment',
    `  Type:        ${viewing.viewingType}`,
    `  Amount:      ${formatMoneyMinor(viewing.feeMinor, viewing.feeCurrency)}`,
    `  Status:      ${viewing.payment.status}`,
    viewing.payment.transactionRef ? `  Txn Ref:     ${viewing.payment.transactionRef}` : null,
    '',
    'Booking status at issue:',
    `  ${viewing.bookingStatus}`,
    '',
    '— End of receipt —',
  ];
  return lines.filter((l) => l !== null).join('\n');
}

/**
 * Generate and email the receipt for a booking. Idempotent: if
 * the receipt has already been emailed, skips re-sending unless
 * force=true.
 *
 * @param {object} viewing - Mongoose Viewing document (not lean)
 * @param {{force?: boolean}} [options]
 */
async function issueReceipt(viewing, { force = false } = {}) {
  if (!viewing.receipt) {
    viewing.receipt = {
      receiptId: require('crypto').randomUUID(),
      receiptNumber: `RCT-${viewing.reference}`,
      generatedAt: new Date(),
      reviewStatus: 'pending',
      pendingSince: null,
      postponedSince: null,
      rescheduledStatusSince: null,
      viewedBy: null,
      viewedAt: null,
      statusHistory: [],
    };
  }

  // Initialize the state machine the first time.
  if (!viewing.receipt.statusHistory || viewing.receipt.statusHistory.length === 0) {
    viewingStateMachine.initializeReceipt(viewing, 'Receipt created');
  }

  if (viewing.receipt.emailedAt && !force) {
    return { emailed: false, reason: 'already-sent' };
  }

  const text = buildReceiptText(viewing);
  const result = await emailService.send({
    to: viewing.buyerContact.email,
    subject: `Viewing receipt — ${viewing.reference}`,
    text,
  });

  if (result.ok) {
    viewing.receipt.emailedAt = new Date();
    viewing.receipt.emailDelivered = true;
    viewing.receipt.emailFailureReason = '';
  } else {
    viewing.receipt.emailDelivered = false;
    viewing.receipt.emailFailureReason = result.error || 'unknown';
    logger.warn('Receipt email failed but booking is valid', {
      reference: viewing.reference,
      reason: result.error,
    });
  }

  await viewing.save();
  return { emailed: result.ok, transport: result.transport };
}

module.exports = { issueReceipt, buildReceiptText, formatMoneyMinor };

// =============================================================
// END OF FILE: backend/src/services/receiptService.js
// =============================================================