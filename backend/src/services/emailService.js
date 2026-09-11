// =============================================================
// FILE: backend/src/services/emailService.js
// =============================================================
// Purpose:
//   Transactional email sending. In development (or when SMTP
//   is not configured) emails are logged to the console instead
//   of being sent — the caller gets a success result either way,
//   so booking flows continue to work.
//
//   When SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS are set,
//   real delivery can be wired in with nodemailer. That
//   integration is stubbed here behind a clear seam.
// =============================================================

'use strict';

const env = require('../config/env');
const logger = require('../utils/logger');

const smtpConfigured = !!(
  process.env.SMTP_HOST &&
  process.env.SMTP_PORT &&
  process.env.SMTP_USER &&
  process.env.SMTP_PASS
);

/**
 * Send a transactional email.
 * @param {{to: string, subject: string, text: string, html?: string}} params
 * @returns {Promise<{ok: boolean, transport: string, error?: string}>}
 */
async function send({ to, subject, text, html }) {
  if (!to) {
    return { ok: false, transport: 'none', error: 'Missing recipient' };
  }

  if (!smtpConfigured) {
    logger.info('Email (dev mode — not sent)', { to, subject });
    console.log('\n----- EMAIL (dev) -----');
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    console.log('---');
    console.log(text);
    console.log('----- END EMAIL -----\n');
    return { ok: true, transport: 'console' };
  }

  // Real SMTP delivery would go here. Kept as a stub so the
  // feature can be exercised end-to-end without credentials.
  logger.warn('SMTP configured but real delivery not yet wired', { to, subject });
  return { ok: false, transport: 'smtp-stub', error: 'SMTP delivery not implemented' };
}

module.exports = { send, smtpConfigured };

// =============================================================
// END OF FILE: backend/src/services/emailService.js
// =============================================================