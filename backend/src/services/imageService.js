// =============================================================
// FILE: backend/src/services/imageService.js
// =============================================================
// Purpose:
//   Server-side image processing (spec §7, §18). Re-encodes
//   uploads with sharp, which also strips metadata (EXIF/GPS).
//   Produces a main image and a thumbnail. Returns storage info
//   used by the Vehicle model.
//
// Storage:
//   Local disk under backend/uploads/ for v1. Path layout:
//     uploads/vehicles/<yyyy>/<mm>/<randomKey>.webp
//     uploads/vehicles/<yyyy>/<mm>/<randomKey>_thumb.webp
//
//   Original filename is NEVER used in the path.
// =============================================================

'use strict';

const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');
const ApiError = require('../utils/ApiError');

const UPLOAD_ROOT = path.join(__dirname, '..', '..', 'uploads');
const MAX_WIDTH = 1600;
const THUMB_WIDTH = 400;
const MAX_INPUT_BYTES = 8 * 1024 * 1024; // 8 MB hard cap pre-processing
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];

function randomKey() {
  return crypto.randomBytes(16).toString('hex');
}

function monthPath() {
  const now = new Date();
  const yyyy = String(now.getUTCFullYear());
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  return path.join(yyyy, mm);
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

/**
 * Process one uploaded file buffer and write two derivatives.
 * @param {Buffer} buffer
 * @param {string} mimeType
 * @returns {Promise<{storageKey:string, url:string, thumbUrl:string, width:number, height:number, sizeBytes:number, mimeType:string}>}
 */
async function processVehicleImage(buffer, mimeType) {
  if (!ALLOWED_MIME.includes(mimeType)) {
    throw ApiError.badRequest(`Unsupported image type: ${mimeType}`);
  }
  if (buffer.length > MAX_INPUT_BYTES) {
    throw ApiError.badRequest('Image exceeds size limit');
  }

  const key = randomKey();
  const rel = monthPath();
  const dir = path.join(UPLOAD_ROOT, 'vehicles', rel);
  await ensureDir(dir);

  const mainName = `${key}.webp`;
  const thumbName = `${key}_thumb.webp`;
  const mainPath = path.join(dir, mainName);
  const thumbPath = path.join(dir, thumbName);

  // sharp strips metadata by default when re-encoding.
  const mainInfo = await sharp(buffer)
    .rotate() // honor orientation, then discard EXIF
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(mainPath);

  await sharp(buffer)
    .rotate()
    .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
    .webp({ quality: 78 })
    .toFile(thumbPath);

  const storageKey = `vehicles/${rel}/${mainName}`;
  const thumbKey = `vehicles/${rel}/${thumbName}`;

  return {
    storageKey,
    url: `/uploads/${storageKey.replace(/\\/g, '/')}`,
    thumbUrl: `/uploads/${thumbKey.replace(/\\/g, '/')}`,
    width: mainInfo.width,
    height: mainInfo.height,
    sizeBytes: mainInfo.size,
    mimeType: 'image/webp',
  };
}

/**
 * Delete an image and its thumbnail given the storage key.
 * Best-effort — does not throw if the file is missing.
 */
async function deleteVehicleImage(storageKey) {
  if (!storageKey) return;
  const safeRel = storageKey.replace(/\\/g, '/');
  if (!safeRel.startsWith('vehicles/')) return; // guard against path traversal

  const mainPath = path.join(UPLOAD_ROOT, safeRel);
  const thumbPath = mainPath.replace(/\.webp$/, '_thumb.webp');

  await fs.unlink(mainPath).catch(() => {});
  await fs.unlink(thumbPath).catch(() => {});
}

module.exports = {
  UPLOAD_ROOT,
  processVehicleImage,
  deleteVehicleImage,
};

// =============================================================
// END OF FILE: backend/src/services/imageService.js
// =============================================================