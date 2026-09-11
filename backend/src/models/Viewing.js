// =============================================================
// FILE: backend/src/models/Viewing.js
// =============================================================
// Purpose:
//   A physical vehicle viewing appointment booked by a buyer.
//   Covers both booking-level status (Confirmed, Cancelled, etc.)
//   and the separate receipt-review state machine described in
//   Section A.6 of the specification addendum.
//
// Design principles:
//   - All status fields are set ONLY by named service functions.
//     Never accepted from request bodies.
//   - All timestamps are stored in UTC.
//   - receiptStatusHistory is append-only.
//   - The booking reference is a human-readable unique code,
//     generated server-side, never submitted by a client.
// =============================================================

'use strict';

const mongoose = require('mongoose');

const { Schema } = mongoose;

// ---------- enums --------------------------------------------
const BOOKING_STATUS = [
  'pending-payment',
  'confirmed',
  'rescheduled',
  'completed',
  'cancelled-by-buyer',
  'cancelled-by-seller',
  'cancelled-by-admin',
  'no-show',
  'payment-failed',
  'payment-refunded',
];

const RECEIPT_REVIEW_STATUS = [
  'pending',
  'viewed',
  'postponed',
  'rescheduled',
];

const VIEWING_TYPE = ['free', 'paid'];

const PAYMENT_STATUS = [
  'not-required',
  'pending',
  'paid',
  'failed',
  'refunded',
];

const CONTACT_METHOD = ['email', 'phone', 'whatsapp', 'any'];

// ---------- sub-schemas --------------------------------------
const receiptStatusHistorySchema = new Schema(
  {
    status: { type: String, enum: RECEIPT_REVIEW_STATUS, required: true },
    changedAt: { type: Date, required: true, default: Date.now },
    changedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    reason: { type: String, trim: true, default: '', maxlength: 500 },
  },
  { _id: false }
);

const rescheduleHistorySchema = new Schema(
  {
    previousDate: { type: String, required: true },       // 'YYYY-MM-DD'
    previousStartTime: { type: String, required: true },  // 'HH:mm'
    previousEndTime: { type: String, required: true },    // 'HH:mm'
    previousLocation: { type: String, trim: true, default: '' },
    newDate: { type: String, required: true },
    newStartTime: { type: String, required: true },
    newEndTime: { type: String, required: true },
    newLocation: { type: String, trim: true, default: '' },
    reason: { type: String, trim: true, default: '', maxlength: 500 },
    changedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    changedAt: { type: Date, required: true, default: Date.now },
  },
  { _id: false }
);

// ---------- main schema --------------------------------------
const viewingSchema = new Schema(
  {
    // ----- Identification ------------------------------------
    reference: {
      type: String,
      required: true,
      unique: true,
      index: true,
      uppercase: true,
      trim: true,
    },

    // ----- Participants --------------------------------------
    buyer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    seller: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    vehicle: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true, index: true },

    // ----- Buyer contact snapshot ----------------------------
    // Snapshot at booking time, so a later account change does not
    // rewrite the historical record.
    buyerContact: {
      name: { type: String, required: true, trim: true, maxlength: 120 },
      email: { type: String, required: true, trim: true, lowercase: true },
      phone: { type: String, trim: true, default: '', maxlength: 32 },
      preferredContact: { type: String, enum: CONTACT_METHOD, default: 'any' },
      note: { type: String, trim: true, default: '', maxlength: 1000 },
    },

    // ----- Appointment slot ----------------------------------
    date: { type: String, required: true },       // 'YYYY-MM-DD' in seller local time
    startTime: { type: String, required: true },  // 'HH:mm'
    endTime: { type: String, required: true },    // 'HH:mm'
    durationMinutes: { type: Number, required: true, min: 5, max: 480 },
    location: { type: String, required: true, trim: true, maxlength: 300 },

    // ----- Booking classification ----------------------------
    viewingType: { type: String, enum: VIEWING_TYPE, required: true },
    feeMinor: { type: Number, required: true, default: 0, min: 0 }, // minor units
    feeCurrency: { type: String, enum: ['KES', 'USD'], default: 'KES' },

    // ----- Booking status (appointment-level) ----------------
    bookingStatus: {
      type: String,
      enum: BOOKING_STATUS,
      required: true,
      default: 'pending-payment',
      index: true,
    },

    // ----- Payment -------------------------------------------
    payment: {
      status: { type: String, enum: PAYMENT_STATUS, default: 'not-required' },
      provider: { type: String, trim: true, default: '' },     // 'paymate' later
      transactionRef: { type: String, trim: true, default: '' },
      paidAt: { type: Date, default: null },
      refundedAt: { type: Date, default: null },
      amountMinor: { type: Number, default: 0, min: 0 },
      currency: { type: String, enum: ['KES', 'USD'], default: 'KES' },
    },

    // ----- Receipt review state machine (§A.6) ---------------
    receipt: {
      // Immutable ID for the receipt document. Signed URLs are keyed to this.
      receiptId: { type: String, required: true, index: true },

      // Human-readable receipt number shown on the document.
      receiptNumber: { type: String, required: true, trim: true },

      // Server-generated. Never accepted from input.
      generatedAt: { type: Date, required: true, default: Date.now },

      // Email delivery status
      emailedAt: { type: Date, default: null },
      emailDelivered: { type: Boolean, default: false },
      emailFailureReason: { type: String, trim: true, default: '' },

      // ---- Receipt review status (the new feature) ----
      reviewStatus: {
        type: String,
        enum: RECEIPT_REVIEW_STATUS,
        required: true,
        default: 'pending',
        index: true,
      },
      pendingSince: { type: Date, default: null },
      postponedSince: { type: Date, default: null },
      rescheduledStatusSince: { type: Date, default: null },
      viewedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
      viewedAt: { type: Date, default: null },

      // Append-only audit of every state transition
      statusHistory: { type: [receiptStatusHistorySchema], default: [] },
    },

    // ----- Reschedule history (booking-level) ----------------
    rescheduleHistory: { type: [rescheduleHistorySchema], default: [] },

    // ----- Cancellation / refund -----------------------------
    cancellation: {
      cancelledAt: { type: Date, default: null },
      cancelledBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
      cancelledByRole: {
        type: String,
        enum: ['buyer', 'seller', 'admin', null],
        default: null,
      },
      reason: { type: String, trim: true, default: '', maxlength: 500 },
      refundAmountMinor: { type: Number, default: 0, min: 0 },
      refundedAt: { type: Date, default: null },
    },

    // ----- Internal admin note --------------------------------
    adminNote: { type: String, trim: true, default: '', maxlength: 2000 },

    // ----- Soft delete ---------------------------------------
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// ----- Indexes -----------------------------------------------
viewingSchema.index({ seller: 1, date: 1, startTime: 1 });   // availability overlap checks
viewingSchema.index({ buyer: 1, createdAt: -1 });            // buyer's bookings
viewingSchema.index({ 'receipt.reviewStatus': 1, 'receipt.pendingSince': 1 });
viewingSchema.index({ 'receipt.reviewStatus': 1, 'receipt.postponedSince': 1 });
viewingSchema.index({ 'receipt.reviewStatus': 1, 'receipt.rescheduledStatusSince': 1 });
viewingSchema.index({ createdAt: -1 });

// ----- Exclude soft-deleted by default -----------------------
viewingSchema.pre(/^find/, function excludeDeleted() {
  if (!this.getOptions().includeDeleted) {
    this.where({ deletedAt: null });
  }
});

// ----- Enum exposure -----------------------------------------
const Viewing = mongoose.model('Viewing', viewingSchema);
Viewing.BOOKING_STATUS = BOOKING_STATUS;
Viewing.RECEIPT_REVIEW_STATUS = RECEIPT_REVIEW_STATUS;
Viewing.VIEWING_TYPE = VIEWING_TYPE;
Viewing.PAYMENT_STATUS = PAYMENT_STATUS;

module.exports = Viewing;

// =============================================================
// END OF FILE: backend/src/models/Viewing.js
// =============================================================