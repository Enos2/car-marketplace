// =============================================================
// FILE: backend/tests/viewingStateMachine.test.js
// =============================================================
// Purpose:
//   Unit tests for the receipt review state machine (§A.6, §E.2).
//   Uses a mocked clock — never waits real time.
//
// Run:
//   cd backend
//   node tests/viewingStateMachine.test.js
// =============================================================

'use strict';

const assert = require('assert');
const sm = require('../src/services/viewingStateMachine');

// ---------- test helpers -------------------------------------
function makeViewing(overrides = {}) {
  return {
    receipt: {
      reviewStatus: 'pending',
      pendingSince: null,
      postponedSince: null,
      rescheduledStatusSince: null,
      viewedBy: null,
      viewedAt: null,
      statusHistory: [],
      ...overrides,
    },
  };
}

function history(viewing) {
  return viewing.receipt.statusHistory.map((h) => h.status);
}

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ok  ${name}`);
  } catch (err) {
    failed++;
    console.error(`FAIL  ${name}`);
    console.error(`      ${err.message}`);
  }
}

// ---------- initialize ---------------------------------------
console.log('\ninitializeReceipt');

test('sets status to pending and records history', () => {
  const v = makeViewing();
  const r = sm.initializeReceipt(v);
  assert.strictEqual(r.changed, true);
  assert.strictEqual(v.receipt.reviewStatus, 'pending');
  assert.ok(v.receipt.pendingSince instanceof Date);
  assert.deepStrictEqual(history(v), ['pending']);
});

// ---------- markViewed ---------------------------------------
console.log('\nmarkViewed');

test('pending → viewed, sets viewedBy/At, clears markers', () => {
  const v = makeViewing({ pendingSince: new Date(Date.now() - 1000) });
  const r = sm.markViewed(v, { adminId: 'admin1' });
  assert.strictEqual(r.changed, true);
  assert.strictEqual(v.receipt.reviewStatus, 'viewed');
  assert.strictEqual(v.receipt.viewedBy, 'admin1');
  assert.ok(v.receipt.viewedAt instanceof Date);
  assert.strictEqual(v.receipt.pendingSince, null);
  assert.deepStrictEqual(history(v), ['viewed']);
});

test('postponed → viewed', () => {
  const v = makeViewing({ reviewStatus: 'postponed', postponedSince: new Date() });
  sm.markViewed(v, { adminId: 'a' });
  assert.strictEqual(v.receipt.reviewStatus, 'viewed');
});

test('rescheduled → viewed', () => {
  const v = makeViewing({ reviewStatus: 'rescheduled', rescheduledStatusSince: new Date() });
  sm.markViewed(v, { adminId: 'a' });
  assert.strictEqual(v.receipt.reviewStatus, 'viewed');
});

test('viewed → viewed is idempotent (no new history)', () => {
  const v = makeViewing({ reviewStatus: 'viewed', viewedBy: 'a', viewedAt: new Date() });
  const r = sm.markViewed(v, { adminId: 'a' });
  assert.strictEqual(r.changed, false);
  assert.deepStrictEqual(history(v), []);
});

test('throws without adminId', () => {
  const v = makeViewing();
  assert.throws(() => sm.markViewed(v, {}), /adminId is required/);
});

// ---------- onReschedule -------------------------------------
console.log('\nonReschedule');

test('from any state → rescheduled, history appended', () => {
  const v = makeViewing({ reviewStatus: 'viewed', viewedBy: 'a', viewedAt: new Date() });
  sm.onReschedule(v, { adminId: 'a2' });
  assert.strictEqual(v.receipt.reviewStatus, 'rescheduled');
  assert.ok(v.receipt.rescheduledStatusSince instanceof Date);
  assert.deepStrictEqual(history(v), ['rescheduled']);
});

// ---------- sweepPending -------------------------------------
console.log('\nsweepPending');

test('pending within window → no change', () => {
  const v = makeViewing({ pendingSince: new Date() });
  const r = sm.sweepPending(v, { windowHours: 24 });
  assert.strictEqual(r.changed, false);
  assert.strictEqual(v.receipt.reviewStatus, 'pending');
});

test('pending > 24h → postponed, history appended', () => {
  const v = makeViewing({
    pendingSince: new Date(Date.now() - 25 * 60 * 60 * 1000),
  });
  const r = sm.sweepPending(v, { windowHours: 24 });
  assert.strictEqual(r.changed, true);
  assert.strictEqual(v.receipt.reviewStatus, 'postponed');
  assert.ok(v.receipt.postponedSince instanceof Date);
  assert.strictEqual(v.receipt.pendingSince, null);
  assert.deepStrictEqual(history(v), ['postponed']);
});

test('idempotent — running twice in same window is a no-op', () => {
  const past = new Date(Date.now() - 25 * 60 * 60 * 1000);
  const v = makeViewing({ pendingSince: past });
  sm.sweepPending(v, { windowHours: 24 });
  const second = sm.sweepPending(v, { windowHours: 24 });
  assert.strictEqual(second.changed, false);
  assert.deepStrictEqual(history(v), ['postponed']);
});

// ---------- sweepPostponed -----------------------------------
console.log('\nsweepPostponed');

test('postponed > 24h → pending, markers reset', () => {
  const v = makeViewing({
    reviewStatus: 'postponed',
    postponedSince: new Date(Date.now() - 25 * 60 * 60 * 1000),
  });
  const r = sm.sweepPostponed(v, { windowHours: 24 });
  assert.strictEqual(r.changed, true);
  assert.strictEqual(v.receipt.reviewStatus, 'pending');
  assert.ok(v.receipt.pendingSince instanceof Date);
  assert.strictEqual(v.receipt.postponedSince, null);
  assert.deepStrictEqual(history(v), ['pending']);
});

// ---------- sweepRescheduled ---------------------------------
console.log('\nsweepRescheduled');

test('rescheduled > 24h → pending', () => {
  const v = makeViewing({
    reviewStatus: 'rescheduled',
    rescheduledStatusSince: new Date(Date.now() - 25 * 60 * 60 * 1000),
  });
  const r = sm.sweepRescheduled(v, { windowHours: 24 });
  assert.strictEqual(r.changed, true);
  assert.strictEqual(v.receipt.reviewStatus, 'pending');
  assert.ok(v.receipt.pendingSince instanceof Date);
  assert.strictEqual(v.receipt.rescheduledStatusSince, null);
  assert.deepStrictEqual(history(v), ['pending']);
});

test('rescheduled within window → no change', () => {
  const v = makeViewing({
    reviewStatus: 'rescheduled',
    rescheduledStatusSince: new Date(Date.now() - 1 * 60 * 60 * 1000),
  });
  const r = sm.sweepRescheduled(v, { windowHours: 24 });
  assert.strictEqual(r.changed, false);
});

// ---------- viewed stability ---------------------------------
console.log('\nviewed stability');

test('viewed does not decay through sweeps', () => {
  const v = makeViewing({
    reviewStatus: 'viewed',
    viewedBy: 'a',
    viewedAt: new Date(Date.now() - 100 * 60 * 60 * 1000),
  });
  const a = sm.sweepPending(v);
  const b = sm.sweepPostponed(v);
  const c = sm.sweepRescheduled(v);
  assert.strictEqual(a.changed, false);
  assert.strictEqual(b.changed, false);
  assert.strictEqual(c.changed, false);
  assert.strictEqual(v.receipt.reviewStatus, 'viewed');
});

// ---------- full lifecycle -----------------------------------
console.log('\nfull 24-hour cycle');

test('pending → postponed → pending over two windows', () => {
  const start = Date.now();
  const v = makeViewing({ pendingSince: new Date(start) });

  // 25h later
  sm.sweepPending(v, { now: new Date(start + 25 * 60 * 60 * 1000) });
  assert.strictEqual(v.receipt.reviewStatus, 'postponed');

  // another 25h later
  sm.sweepPostponed(v, { now: new Date(start + 50 * 60 * 60 * 1000) });
  assert.strictEqual(v.receipt.reviewStatus, 'pending');

  assert.deepStrictEqual(history(v), ['postponed', 'pending']);
});

// ---------- summary ------------------------------------------
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);

// =============================================================
// END OF FILE: backend/tests/viewingStateMachine.test.js
// =============================================================