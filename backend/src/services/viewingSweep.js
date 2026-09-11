// =============================================================
// FILE: backend/src/services/viewingSweep.js
// =============================================================
// Purpose:
//   Scheduled sweep of receipt review status (§A.6 rules 3–6).
//   Idempotent; safe to re-run.
// =============================================================

'use strict';

const Viewing = require('../models/Viewing');
const viewingStateMachine = require('./viewingStateMachine');
const env = require('../config/env');

async function sweepAll({ now = new Date(), windowHours = env.VIEWING_REVIEW_WINDOW_HOURS } = {}) {
  const results = {
    pending: { examined: 0, changed: 0 },
    postponed: { examined: 0, changed: 0 },
    rescheduled: { examined: 0, changed: 0 },
  };

  // ---- Pending → Postponed -----------------------------------
  {
    const cutoff = new Date(now.getTime() - windowHours * 60 * 60 * 1000);
    const candidates = await Viewing.find({
      'receipt.reviewStatus': 'pending',
      'receipt.pendingSince': { $lt: cutoff },
    });
    results.pending.examined = candidates.length;
    for (const v of candidates) {
      const r = viewingStateMachine.sweepPending(v, { windowHours, now });
      if (r.changed) {
        await v.save();
        results.pending.changed++;
      }
    }
  }

  // ---- Postponed → Pending -----------------------------------
  {
    const cutoff = new Date(now.getTime() - windowHours * 60 * 60 * 1000);
    const candidates = await Viewing.find({
      'receipt.reviewStatus': 'postponed',
      'receipt.postponedSince': { $lt: cutoff },
    });
    results.postponed.examined = candidates.length;
    for (const v of candidates) {
      const r = viewingStateMachine.sweepPostponed(v, { windowHours, now });
      if (r.changed) {
        await v.save();
        results.postponed.changed++;
      }
    }
  }

  // ---- Rescheduled → Pending ---------------------------------
  {
    const cutoff = new Date(now.getTime() - windowHours * 60 * 60 * 1000);
    const candidates = await Viewing.find({
      'receipt.reviewStatus': 'rescheduled',
      'receipt.rescheduledStatusSince': { $lt: cutoff },
    });
    results.rescheduled.examined = candidates.length;
    for (const v of candidates) {
      const r = viewingStateMachine.sweepRescheduled(v, { windowHours, now });
      if (r.changed) {
        await v.save();
        results.rescheduled.changed++;
      }
    }
  }

  return results;
}

module.exports = { sweepAll };

// =============================================================
// END OF FILE: backend/src/services/viewingSweep.js
// =============================================================