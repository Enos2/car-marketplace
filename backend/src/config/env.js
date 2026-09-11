// =============================================================
// FILE: backend/src/config/env.js
// =============================================================
// Purpose:
//   Validates required environment variables at startup and
//   exports a typed, frozen env object. Fails fast if any
//   required variable is missing.
// =============================================================

'use strict';

const REQUIRED = [
  'MONGODB_URI',
  'JWT_ACCESS_SECRET',
  'SESSION_SECRET',
];

const OPTIONAL_DEFAULTS = {
  NODE_ENV: 'development',
  PORT: '5000',
  CLIENT_URL: 'http://localhost:5173',
  JWT_ACCESS_EXPIRES: '15m',
  JWT_REFRESH_EXPIRES: '7d',
  EXCHANGE_RATE_BASE: 'USD',
  EXCHANGE_RATE_TARGET: 'KES',
  EXCHANGE_RATE_MAX_AGE_MINUTES: '120',

  // Viewings / booking
  VIEWING_REVIEW_WINDOW_HOURS: '24',
  VIEWING_SWEEP_ENABLED: 'true',
  VIEWING_SWEEP_INTERVAL_MINUTES: '15',

  // Payment
  PAYMENT_PROVIDER: '',
  PAYMENT_WEBHOOK_SECRET: '',

  // Receipt signed URLs
  RECEIPT_SIGNED_URL_EXPIRES_MINUTES: '30',
};

function loadEnv() {
  const missing = REQUIRED.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    console.error(`[env] Missing required variables: ${missing.join(', ')}`);
    process.exit(1);
  }

  for (const [key, value] of Object.entries(OPTIONAL_DEFAULTS)) {
    if (process.env[key] === undefined || process.env[key] === '') {
      process.env[key] = value;
    }
  }

  const env = {
    NODE_ENV: process.env.NODE_ENV,
    PORT: parseInt(process.env.PORT, 10),
    CLIENT_URL: process.env.CLIENT_URL,

    MONGODB_URI: process.env.MONGODB_URI,

    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
    JWT_ACCESS_EXPIRES: process.env.JWT_ACCESS_EXPIRES,
    SESSION_SECRET: process.env.SESSION_SECRET,

    EXCHANGE_RATE_API_KEY: process.env.EXCHANGE_RATE_API_KEY || '',
    EXCHANGE_RATE_BASE: process.env.EXCHANGE_RATE_BASE,
    EXCHANGE_RATE_TARGET: process.env.EXCHANGE_RATE_TARGET,
    EXCHANGE_RATE_MAX_AGE_MINUTES: parseInt(
      process.env.EXCHANGE_RATE_MAX_AGE_MINUTES,
      10
    ),

    VIEWING_REVIEW_WINDOW_HOURS: parseInt(process.env.VIEWING_REVIEW_WINDOW_HOURS, 10),
    VIEWING_SWEEP_ENABLED: process.env.VIEWING_SWEEP_ENABLED === 'true',
    VIEWING_SWEEP_INTERVAL_MINUTES: parseInt(process.env.VIEWING_SWEEP_INTERVAL_MINUTES, 10),

    PAYMENT_PROVIDER: process.env.PAYMENT_PROVIDER || '',
    PAYMENT_WEBHOOK_SECRET: process.env.PAYMENT_WEBHOOK_SECRET || '',

    RECEIPT_SIGNED_URL_SECRET: process.env.RECEIPT_SIGNED_URL_SECRET || process.env.SESSION_SECRET,
    RECEIPT_SIGNED_URL_EXPIRES_MINUTES: parseInt(
      process.env.RECEIPT_SIGNED_URL_EXPIRES_MINUTES,
      10
    ),

    isProd: process.env.NODE_ENV === 'production',
    isDev: process.env.NODE_ENV !== 'production',
  };

  if (env.isProd && env.RECEIPT_SIGNED_URL_SECRET === env.SESSION_SECRET) {
    console.warn(
      '[env] WARNING: RECEIPT_SIGNED_URL_SECRET is falling back to SESSION_SECRET. Set it explicitly in production.'
    );
  }

  return Object.freeze(env);
}

module.exports = loadEnv();

// =============================================================
// END OF FILE: backend/src/config/env.js
// =============================================================