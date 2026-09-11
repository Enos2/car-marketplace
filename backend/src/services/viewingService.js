// =============================================================
// FILE: backend/src/services/viewingService.js
// =============================================================
// Purpose:
//   Business logic for vehicle viewings: reference generation,
//   slot availability, booking creation, and the branching
//   between free (immediate confirmation) and paid (deferred
//   until a payment webhook confirms).
//
// Design rules (per addendum §A, §E):
//   - Every monetary value and status computed server-side.
//   - No status value ever taken from the client.
//   - Slot availability uses the viewing record, not the request.
//   - Seller authorization: only the seller of a vehicle may
//     publish slots for it (via their own availability config).
// =============================================================

'use strict';

const crypto = require('crypto');
const Viewing = require('../models/Viewing');
const Vehicle = require('../models/Vehicle');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

// ---------- reference generation -----------------------------
// Format: VM-YYYYMMDD-XXXXXX (6 random base32 chars)
const REF_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I, O, 0, 1

function randomRefSuffix(len = 6) {
  const bytes = crypto.randomBytes(len);
  let out = '';
  for (let i = 0; i < len; i++) {
    out += REF_ALPHABET[bytes[i] % REF_ALPHABET.length];
  }
  return out;
}

function datePart(d = new Date()) {
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${yyyy}${mm}${dd}`;
}

async function generateUniqueReference() {
  for (let attempt = 0; attempt < 5; attempt++) {
    const ref = `VM-${datePart()}-${randomRefSuffix(6)}`;
    const exists = await Viewing.exists({ reference: ref });
    if (!exists) return ref;
  }
  throw ApiError.internal('Could not generate unique booking reference');
}

// ---------- slot availability --------------------------------
/**
 * Return the set of booked start times for a seller on a given date.
 * @param {string} sellerId
 * @param {string} date 'YYYY-MM-DD'
 */
async function getBookedSlots(sellerId, date) {
  const items = await Viewing.find({
    seller: sellerId,
    date,
    bookingStatus: { $nin: ['cancelled-by-buyer', 'cancelled-by-seller', 'cancelled-by-admin', 'payment-failed'] },
  })
    .select('startTime endTime')
    .lean();
  return items;
}

/**
 * Compute available slots from a seller's published availability
 * and their existing bookings. Availability config is a
 * lightweight object on SellerProfile.viewingAvailability.
 *
 * For v1, availability is expressed as repeating weekday windows:
 *   availability = {
 *     days: [1,2,3,4,5],           // 0=Sun ... 6=Sat
 *     windows: [{start:'09:00', end:'17:00'}],
 *     slotMinutes: 60,
 *     location: 'Showroom address',
 *   }
 */
function timeToMinutes(hhmm) {
  const [h, m] = String(hhmm).split(':').map((x) => parseInt(x, 10));
  return h * 60 + m;
}

function minutesToTime(total) {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function generateSlotStarts(availability) {
  const starts = [];
  for (const w of availability.windows || []) {
    let cursor = timeToMinutes(w.start);
    const end = timeToMinutes(w.end);
    while (cursor + availability.slotMinutes <= end) {
      starts.push({
        start: minutesToTime(cursor),
        end: minutesToTime(cursor + availability.slotMinutes),
      });
      cursor += availability.slotMinutes;
    }
  }
  return starts;
}

async function listAvailableSlots(vehicleId, dateISO) {
  const vehicle = await Vehicle.findOne({ _id: vehicleId, status: 'published' })
    .populate('seller')
    .lean();
  if (!vehicle) throw ApiError.notFound('Vehicle not found');
  if (!vehicle.seller) throw ApiError.notFound('Seller not found for vehicle');

  const date = new Date(`${dateISO}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) throw ApiError.badRequest('Invalid date');
  const weekday = date.getUTCDay();

  const availability = vehicle.seller.viewingAvailability || null;
  if (!availability || !availability.days || !availability.windows) {
    return {
      vehicle: vehicle._id,
      date: dateISO,
      slots: [],
      reason: 'seller-has-no-availability',
    };
  }

  if (!availability.days.includes(weekday)) {
    return { vehicle: vehicle._id, date: dateISO, slots: [], reason: 'not-a-working-day' };
  }

  const allSlots = generateSlotStarts(availability);
  const booked = await getBookedSlots(vehicle.seller._id, dateISO);
  const bookedStarts = new Set(booked.map((b) => b.startTime));

  const free = allSlots
    .filter((s) => !bookedStarts.has(s.start))
    .map((s) => ({
      start: s.start,
      end: s.end,
      durationMinutes: availability.slotMinutes,
      location: availability.location || '',
    }));

  return {
    vehicle: vehicle._id,
    date: dateISO,
    slotMinutes: availability.slotMinutes,
    slots: free,
  };
}

// ---------- booking creation ---------------------------------
/**
 * Create a viewing booking.
 * @param {object} params
 * @param {object} params.buyerUser  - Mongoose user doc (required)
 * @param {string} params.vehicleId
 * @param {object} params.input      - validated payload
 */
async function createBooking({ buyerUser, vehicleId, input }) {
  const vehicle = await Vehicle.findOne({ _id: vehicleId, status: 'published' }).lean();
  if (!vehicle) throw ApiError.notFound('Vehicle not found');
  if (!vehicle.seller) throw ApiError.notFound('Seller not found for vehicle');

  // -------- slot validation (server-authoritative) --------
  const date = new Date(`${input.date}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) throw ApiError.badRequest('Invalid date');
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  if (date < today) throw ApiError.badRequest('Date is in the past');

  const seller = await User.findById(vehicle.seller).lean();
  if (!seller) throw ApiError.notFound('Seller not found');

  const availability = seller.viewingAvailability || null;
  if (!availability || !availability.windows) {
    throw ApiError.badRequest('Seller has not published viewing availability');
  }

  const weekday = date.getUTCDay();
  if (!availability.days?.includes(weekday)) {
    throw ApiError.badRequest('Selected date is not a working day');
  }

  const allSlots = generateSlotStarts(availability);
  const requested = allSlots.find((s) => s.start === input.startTime);
  if (!requested) {
    throw ApiError.badRequest('Selected time is not a valid slot');
  }

  const clash = await Viewing.findOne({
    seller: vehicle.seller,
    date: input.date,
    startTime: input.startTime,
    bookingStatus: {
      $nin: [
        'cancelled-by-buyer',
        'cancelled-by-seller',
        'cancelled-by-admin',
        'payment-failed',
      ],
    },
  }).lean();
  if (clash) throw ApiError.conflict('Slot is already booked');

  // -------- fee (server-authoritative) --------------------
  const viewingType = availability.feeMinor && availability.feeMinor > 0 ? 'paid' : 'free';
  const feeMinor = viewingType === 'paid' ? availability.feeMinor : 0;
  const feeCurrency = availability.feeCurrency || 'KES';

  if (viewingType === 'paid' && !process.env.PAYMENT_PROVIDER) {
    throw ApiError.badRequest(
      'Paid viewings are not yet enabled. Payment integration is pending.'
    );
  }

  // -------- create ----------------------------------------
  const reference = await generateUniqueReference();

  const bookingStatus = viewingType === 'free' ? 'confirmed' : 'pending-payment';
  const paymentStatus = viewingType === 'free' ? 'not-required' : 'pending';

  const viewing = await Viewing.create({
    reference,
    buyer: buyerUser._id,
    seller: vehicle.seller,
    vehicle: vehicle._id,
    buyerContact: {
      name: input.name || buyerUser.name,
      email: input.email || buyerUser.email,
      phone: input.phone || buyerUser.phone || '',
      preferredContact: input.preferredContact || 'any',
      note: input.note || '',
    },
    date: input.date,
    startTime: requested.start,
    endTime: requested.end,
    durationMinutes: availability.slotMinutes,
    location: availability.location || 'Location provided by seller',
    viewingType,
    feeMinor,
    feeCurrency,
    bookingStatus,
    payment: {
      status: paymentStatus,
      provider: process.env.PAYMENT_PROVIDER || '',
      transactionRef: '',
      amountMinor: viewingType === 'paid' ? feeMinor : 0,
      currency: feeCurrency,
    },
    receipt: {
      receiptId: crypto.randomUUID(),
      receiptNumber: `RCT-${reference}`,
      generatedAt: new Date(),
    },
  });

  logger.info('Viewing created', {
    reference: viewing.reference,
    viewingType,
    bookingStatus,
  });

  return viewing;
}

module.exports = {
  generateUniqueReference,
  listAvailableSlots,
  createBooking,
  // exposed for the seller availability endpoint later
  _internal: { generateSlotStarts, timeToMinutes, minutesToTime },
};

// =============================================================
// END OF FILE: backend/src/services/viewingService.js
// =============================================================