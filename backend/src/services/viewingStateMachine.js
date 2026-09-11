// =============================================================
// FILE: backend/src/services/viewingStateMachine.js
// =============================================================
// Purpose:
//   The ONLY module allowed to write receipt.reviewStatus or
//   append to receipt.statusHistory. Implements the transition
//   rules from §A.6 of the specification addendum.
//
// Transitions implemented (each a named function):
//   markViewed          — admin explicitly opens/acknowledges
//   onReschedule        — admin reschedules the viewing
//   sweepPending        — scheduled: Pending  → Postponed (>24h)
//   sweepPostponed      — scheduled: Postponed → Pending  (>24h)
//   sweepRescheduled    — scheduled: Rescheduled → Pending (>24h)
//
// Contract for every function:
//   - Takes (viewingDoc, options) where viewingDoc is a Mongoose
//     document (not lean) so we can .save().
//   - Returns { changed: boolean, reason: string }.
//   - Never throws on "no transition needed" — returns changed:false.
//   - Idempotent: running twice in the same window is a no-op.
//   - All time math in UTC milliseconds.
//
// Reason strings are recorded in statusHistory so the full
// lifecycle is reconstructable (§A.6 "Where it's used").
// =============================================================

'use strict';

const MS_PER_HOUR = 60 * 60 * 1000;

const DEFAULT_REVIEW_WINDOW_HOURS = 24;

function nowUtc() {
  return new Date(Date.now());
}

function hoursSince(then, now = nowUtc()) {
  if (!then) return 0;
  return (now.getTime() - new Date(then).getTime()) / MS_PER_HOUR;
}

function ensureReceipt(viewing) {
  if (!viewing || !viewing.receipt) {
    throw new Error('viewingStateMachine: viewing.receipt is required');
  }
}

function appendHistory(viewing, status, changedBy, reason) {
  viewing.receipt.statusHistory.push({
    status,
    changedAt: nowUtc(),
    changedBy: changedBy || null,
    reason: reason || '',
  });
}

/**
 * Initialize a freshly-created receipt into the Pending state.
 * Called from the receipt generation service, not from the API.
 * @param {object} viewing - Mongoose document
 * @param {string} reason
 */
function initializeReceipt(viewing, reason = 'Receipt created') {
  ensureReceipt(viewing);
  const now = nowUtc();

  viewing.receipt.reviewStatus = 'pending';
  viewing.receipt.pendingSince = now;
  viewing.receipt.postponedSince = null;
  viewing.receipt.rescheduledStatusSince = null;
  viewing.receipt.viewedBy = null;
  viewing.receipt.viewedAt = null;

  appendHistory(viewing, 'pending', null, reason);
  return { changed: true, reason };
}

/**
 * Admin explicitly acknowledges the receipt.
 * Allowed from Pending, Postponed, or Rescheduled.
 * Idempotent when already Viewed.
 * @param {object} viewing
 * @param {{adminId: string|object, reason?: string}} options
 */
function markViewed(viewing, { adminId, reason = 'Admin marked as reviewed' } = {}) {
  ensureReceipt(viewing);
  if (!adminId) throw new Error('markViewed: adminId is required');

  const current = viewing.receipt.reviewStatus;

  if (current === 'viewed') {
    return { changed: false, reason: 'Already viewed' };
  }

  if (!['pending', 'postponed', 'rescheduled'].includes(current)) {
    return { changed: false, reason: `Unexpected status: ${current}` };
  }

  const now = nowUtc();
  viewing.receipt.reviewStatus = 'viewed';
  viewing.receipt.viewedBy = adminId;
  viewing.receipt.viewedAt = now;

  // Reset interval markers so a future reschedule starts clean.
  viewing.receipt.pendingSince = null;
  viewing.receipt.postponedSince = null;
  viewing.receipt.rescheduledStatusSince = null;

  appendHistory(viewing, 'viewed', adminId, reason);
  return { changed: true, reason };
}

/**
 * Admin rescheduled the viewing. Forces review status to Rescheduled
 * from ANY prior state (including Viewed), since the receipt's
 * information just changed.
 * @param {object} viewing
 * @param {{adminId: string|object, reason?: string}} options
 */
function onReschedule(viewing, { adminId, reason = 'Viewing rescheduled' } = {}) {
  ensureReceipt(viewing);
  if (!adminId) throw new Error('onReschedule: adminId is required');

  const now = nowUtc();

  viewing.receipt.reviewStatus = 'rescheduled';
  viewing.receipt.rescheduledStatusSince = now;
  viewing.receipt.pendingSince = null;
  viewing.receipt.postponedSince = null;

  appendHistory(viewing, 'rescheduled', adminId, reason);
  return { changed: true, reason };
}

/**
 * Scheduled sweep: Pending → Postponed after the review window.
 * @param {object} viewing
 * @param {{windowHours?: number, now?: Date}} [options]
 */
function sweepPending(viewing, { windowHours = DEFAULT_REVIEW_WINDOW_HOURS, now = nowUtc() } = {}) {
  ensureReceipt(viewing);
  if (viewing.receipt.reviewStatus !== 'pending') {
    return { changed: false, reason: 'Not pending' };
  }
  if (!viewing.receipt.pendingSince) {
    // Defensive: repair a missing marker rather than transition.
    viewing.receipt.pendingSince = now;
    return { changed: false, reason: 'Reset missing pendingSince' };
  }

  const elapsed = hoursSince(viewing.receipt.pendingSince, now);
  if (elapsed <= windowHours) {
    return { changed: false, reason: 'Within review window' };
  }

  viewing.receipt.reviewStatus = 'postponed';
  viewing.receipt.postponedSince = now;
  viewing.receipt.pendingSince = null;

  appendHistory(
    viewing,
    'postponed',
    null,
    `Auto-postponed after ${windowHours}h unreviewed`
  );
  return { changed: true, reason: 'postponed' };
}

/**
 * Scheduled sweep: Postponed → Pending after the window, if still
 * unreviewed. This resurfaces a stale receipt into the admin queue.
 * @param {object} viewing
 * @param {{windowHours?: number, now?: Date}} [options]
 */
function sweepPostponed(viewing, { windowHours = DEFAULT_REVIEW_WINDOW_HOURS, now = nowUtc() } = {}) {
  ensureReceipt(viewing);
  if (viewing.receipt.reviewStatus !== 'postponed') {
    return { changed: false, reason: 'Not postponed' };
  }
  if (!viewing.receipt.postponedSince) {
    viewing.receipt.postponedSince = now;
    return { changed: false, reason: 'Reset missing postponedSince' };
  }

  const elapsed = hoursSince(viewing.receipt.postponedSince, now);
  if (elapsed <= windowHours) {
    return { changed: false, reason: 'Within postponed window' };
  }

  viewing.receipt.reviewStatus = 'pending';
  viewing.receipt.pendingSince = now;
  viewing.receipt.postponedSince = null;

  appendHistory(
    viewing,
    'pending',
    null,
    `Auto-resurfaced after ${windowHours}h postponed`
  );
  return { changed: true, reason: 'pending' };
}

/**
 * Scheduled sweep: Rescheduled → Pending after the window, if still
 * unreviewed.
 * @param {object} viewing
 * @param {{windowHours?: number, now?: Date}} [options]
 */
function sweepRescheduled(viewing, { windowHours = DEFAULT_REVIEW_WINDOW_HOURS, now = nowUtc() } = {}) {
  ensureReceipt(viewing);
  if (viewing.receipt.reviewStatus !== 'rescheduled') {
    return { changed: false, reason: 'Not rescheduled' };
  }
  if (!viewing.receipt.rescheduledStatusSince) {
    viewing.receipt.rescheduledStatusSince = now;
    return { changed: false, reason: 'Reset missing rescheduledStatusSince' };
  }

  const elapsed = hoursSince(viewing.receipt.rescheduledStatusSince, now);
  if (elapsed <= windowHours) {
    return { changed: false, reason: 'Within rescheduled window' };
  }

  viewing.receipt.reviewStatus = 'pending';
  viewing.receipt.pendingSince = now;
  viewing.receipt.rescheduledStatusSince = null;

  appendHistory(
    viewing,
    'pending',
    null,
    `Auto-resurfaced after ${windowHours}h rescheduled`
  );
  return { changed: true, reason: 'pending' };
}

module.exports = {
  DEFAULT_REVIEW_WINDOW_HOURS,
  initializeReceipt,
  markViewed,
  onReschedule,
  sweepPending,
  sweepPostponed,
  sweepRescheduled,
  // exposed for tests
  _internal: { hoursSince, nowUtc },
};

// =============================================================
// END OF FILE: backend/src/services/viewingStateMachine.js
// =============================================================