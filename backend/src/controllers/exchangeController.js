// =============================================================
// FILE: backend/src/controllers/exchangeController.js
// =============================================================
// Purpose:
//   Public: latest exchange rate for display conversion.
//   Admin:  force refresh.
//   Rate is stored as a string to avoid float drift.
// =============================================================

'use strict';

const asyncHandler = require('../utils/asyncHandler');
const { getLatestRate, refreshRate } = require('../services/exchangeService');
const env = require('../config/env');

const getRate = asyncHandler(async (req, res) => {
  const { rate, source, sourceTimestamp, fetchedAt, isFallback, isStale } = await getLatestRate();

  res.json({
    data: {
      base: env.EXCHANGE_RATE_BASE,
      target: env.EXCHANGE_RATE_TARGET,
      rate,
      source: source || null,
      sourceTimestamp: sourceTimestamp || null,
      fetchedAt: fetchedAt || null,
      isFallback: !!isFallback,
      isStale: !!isStale,
    },
  });
});

const refresh = asyncHandler(async (req, res) => {
  const doc = await refreshRate();
  res.json({ data: doc });
});

module.exports = { getRate, refresh };

// =============================================================
// END OF FILE: backend/src/controllers/exchangeController.js
// =============================================================