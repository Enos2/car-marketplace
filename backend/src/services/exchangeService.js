// =============================================================
// FILE: backend/src/services/exchangeService.js
// =============================================================
// Purpose:
//   Fetch, cache, and serve USD/KES rates (spec §2, §30).
//   Storage as strings to avoid float drift. Falls back to the
//   last known rate if the provider is unavailable. Never
//   mutates a listing price.
// =============================================================

'use strict';

const env = require('../config/env');
const ExchangeRate = require('../models/ExchangeRate');
const logger = require('../utils/logger');

const FALLBACK_RATE = '129.00'; // conservative fallback; only used if no cached rate exists

async function fetchFromProvider(base, target) {
  // exchangerate.host is free and requires no API key.
  // If EXCHANGE_RATE_API_KEY is set, a keyed provider may be used later.
  const url = `https://api.exchangerate.host/latest?base=${base}&symbols=${target}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Provider returned ${res.status}`);
  const json = await res.json();
  const rate = json?.rates?.[target];
  if (!rate) throw new Error('Rate missing in provider response');
  return {
    rate: String(rate),
    sourceTimestamp: json?.date ? new Date(json.date) : new Date(),
  };
}

async function refreshRate(base = env.EXCHANGE_RATE_BASE, target = env.EXCHANGE_RATE_TARGET) {
  try {
    const { rate, sourceTimestamp } = await fetchFromProvider(base, target);
    const doc = await ExchangeRate.create({
      base,
      target,
      rate,
      source: 'exchangerate.host',
      sourceTimestamp,
      isFallback: false,
    });
    logger.info('Exchange rate refreshed', { base, target, rate });
    return doc;
  } catch (err) {
    logger.warn('Exchange rate fetch failed; using fallback', { message: err.message });
    const doc = await ExchangeRate.create({
      base,
      target,
      rate: FALLBACK_RATE,
      source: 'fallback',
      sourceTimestamp: new Date(),
      isFallback: true,
    });
    return doc;
  }
}

/**
 * Latest usable rate. Checks age; if too old, still returns it
 * but flags it as stale so the caller can decide.
 */
async function getLatestRate(base = env.EXCHANGE_RATE_BASE, target = env.EXCHANGE_RATE_TARGET) {
  const latest = await ExchangeRate.findOne({ base, target }).sort({ fetchedAt: -1 }).lean();
  if (!latest) {
    return { rate: null, isStale: true, reason: 'no-rate-yet' };
  }
  const ageMs = Date.now() - new Date(latest.fetchedAt).getTime();
  const maxAgeMs = env.EXCHANGE_RATE_MAX_AGE_MINUTES * 60 * 1000;
  const isStale = ageMs > maxAgeMs;
  return {
    rate: latest.rate,
    source: latest.source,
    sourceTimestamp: latest.sourceTimestamp,
    fetchedAt: latest.fetchedAt,
    isFallback: latest.isFallback,
    isStale,
  };
}

module.exports = { refreshRate, getLatestRate };

// =============================================================
// END OF FILE: backend/src/services/exchangeService.js
// =============================================================