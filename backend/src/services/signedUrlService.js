// =============================================================
// FILE: backend/src/services/signedUrlService.js
// =============================================================
// Purpose:
//   Short-lived HMAC-signed tokens for receipt access (§B.3).
// =============================================================

'use strict';

const crypto = require('crypto');
const env = require('../config/env');

function b64url(buf) {
  return Buffer.from(buf)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function fromB64url(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return Buffer.from(str, 'base64');
}

function sign(payloadStr) {
  return crypto
    .createHmac('sha256', env.RECEIPT_SIGNED_URL_SECRET)
    .update(payloadStr)
    .digest();
}

function signReceiptToken(receiptId, expiresMinutes = env.RECEIPT_SIGNED_URL_EXPIRES_MINUTES) {
  if (!receiptId) throw new Error('signReceiptToken: receiptId required');
  const exp = Math.floor(Date.now() / 1000) + expiresMinutes * 60;
  const payload = `${receiptId}.${exp}`;
  const sig = sign(payload);
  return `${b64url(payload)}.${b64url(sig)}`;
}

function verifyReceiptToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) {
    return { ok: false, reason: 'malformed' };
  }
  const [payloadB64, sigB64] = token.split('.');
  let payload, providedSig;
  try {
    payload = fromB64url(payloadB64).toString('utf8');
    providedSig = fromB64url(sigB64);
  } catch {
    return { ok: false, reason: 'malformed' };
  }

  const expectedSig = sign(payload);
  if (
    providedSig.length !== expectedSig.length ||
    !crypto.timingSafeEqual(providedSig, expectedSig)
  ) {
    return { ok: false, reason: 'bad-signature' };
  }

  const [receiptId, expStr] = payload.split('.');
  const exp = parseInt(expStr, 10);
  if (!receiptId || !exp) return { ok: false, reason: 'malformed' };
  if (Math.floor(Date.now() / 1000) > exp) return { ok: false, reason: 'expired' };

  return { ok: true, receiptId, exp };
}

module.exports = { signReceiptToken, verifyReceiptToken };

// =============================================================
// END OF FILE: backend/src/services/signedUrlService.js
// =============================================================