// =============================================================
// FILE: backend/src/utils/logger.js
// =============================================================
// Purpose:
//   Minimal structured logger. Swap for pino/winston later.
//   Never logs secrets. Redacts anything that looks like a
//   password, token, or connection string.
// =============================================================

'use strict';

const REDACT_KEYS = [
  'password',
  'passwordHash',
  'token',
  'accessToken',
  'refreshToken',
  'authorization',
  'cookie',
  'MONGODB_URI',
  'JWT_ACCESS_SECRET',
  'SESSION_SECRET',
];

function redact(value) {
  if (!value || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(redact);

  const out = {};
  for (const [k, v] of Object.entries(value)) {
    if (REDACT_KEYS.includes(k)) {
      out[k] = '[REDACTED]';
    } else if (typeof v === 'object' && v !== null) {
      out[k] = redact(v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

function emit(level, message, meta) {
  const line = {
    ts: new Date().toISOString(),
    level,
    message,
    ...(meta ? { meta: redact(meta) } : {}),
  };
  const out = level === 'error' || level === 'warn' ? console.error : console.log;
  out(JSON.stringify(line));
}

module.exports = {
  info: (msg, meta) => emit('info', msg, meta),
  warn: (msg, meta) => emit('warn', msg, meta),
  error: (msg, meta) => emit('error', msg, meta),
};

// =============================================================
// END OF FILE: backend/src/utils/logger.js
// =============================================================