// =============================================================
// FILE: backend/src/jobs/viewingSweepCron.js
// =============================================================
// Purpose:
//   Registers the receipt-review sweep on a fixed interval.
//   Gated by env.VIEWING_SWEEP_ENABLED.
// =============================================================

'use strict';

const cron = require('node-cron');
const env = require('../config/env');
const logger = require('../utils/logger');
const { sweepAll } = require('../services/viewingSweep');

let task = null;

function start() {
  if (!env.VIEWING_SWEEP_ENABLED) {
    logger.info('Viewing sweep disabled (VIEWING_SWEEP_ENABLED=false)');
    return;
  }

  const minutes = env.VIEWING_SWEEP_INTERVAL_MINUTES;
  const expr = `*/${minutes} * * * *`;

  task = cron.schedule(
    expr,
    async () => {
      const startedAt = Date.now();
      try {
        const results = await sweepAll();
        logger.info('Viewing sweep completed', {
          elapsedMs: Date.now() - startedAt,
          pending: results.pending,
          postponed: results.postponed,
          rescheduled: results.rescheduled,
        });
      } catch (err) {
        logger.error('Viewing sweep failed', { message: err.message });
      }
    },
    { scheduled: true }
  );

  logger.info('Viewing sweep scheduled', { intervalMinutes: minutes });
}

function stop() {
  if (task) {
    task.stop();
    task = null;
    logger.info('Viewing sweep stopped');
  }
}

module.exports = { start, stop };

// =============================================================
// END OF FILE: backend/src/jobs/viewingSweepCron.js
// =============================================================