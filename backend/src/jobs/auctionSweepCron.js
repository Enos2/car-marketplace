// =============================================================
// FILE: backend/src/jobs/auctionSweepCron.js
// =============================================================
// Purpose:
//   Closes live auctions whose endsAt has passed. Awards winner
//   if the reserve was met. Runs every minute.
// =============================================================

'use strict';

const cron = require('node-cron');
const Auction = require('../models/Auction');
const Bid = require('../models/Bid');
const logger = require('../utils/logger');

let task = null;

async function sweep() {
  const now = new Date();
  const due = await Auction.find({
    status: 'live',
    endsAt: { $lte: now },
  });

  for (const a of due) {
    const reserveMet = a.currentBidMinor >= a.reserveMinor;
    a.status = 'ended';
    if (reserveMet && a.currentBidder) {
      a.winner = a.currentBidder;
    }
    await a.save();
    logger.info('Auction ended', {
      auctionId: String(a._id),
      reserveMet,
      winner: a.winner ? String(a.winner) : null,
    });
  }

  return due.length;
}

function start() {
  task = cron.schedule(
    '* * * * *', // every minute
    async () => {
      try {
        const closed = await sweep();
        if (closed > 0) logger.info('Auction sweep closed', { count: closed });
      } catch (err) {
        logger.error('Auction sweep failed', { message: err.message });
      }
    },
    { scheduled: true }
  );
  logger.info('Auction sweep scheduled (every minute)');
}

function stop() {
  if (task) { task.stop(); task = null; }
}

module.exports = { start, stop, sweep };

// =============================================================
// END OF FILE: backend/src/jobs/auctionSweepCron.js
// =============================================================