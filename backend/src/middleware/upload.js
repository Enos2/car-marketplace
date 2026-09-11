// =============================================================
// FILE: backend/src/middleware/upload.js
// =============================================================
// Purpose:
//   Multer setup for vehicle image uploads (spec §7, §18).
//   Memory storage only — the actual writing happens in
//   imageService after magic-byte validation. Never trust the
//   browser MIME type alone.
// =============================================================

'use strict';

const multer = require('multer');
const ApiError = require('../utils/ApiError');

const MAX_FILES = 10;
const MAX_FILE_BYTES = 8 * 1024 * 1024; // 8 MB per file

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_BYTES,
    files: MAX_FILES,
  },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      return cb(ApiError.badRequest(`Unsupported image type: ${file.mimetype}`));
    }
    cb(null, true);
  },
});

function handleMulterErrors(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(ApiError.badRequest('File too large (max 8 MB)'));
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return next(ApiError.badRequest('Too many files (max 10)'));
    }
    return next(ApiError.badRequest(err.message));
  }
  next(err);
}

const uploadVehicleImages = (req, res, next) => {
  upload.array('images', MAX_FILES)(req, res, (err) => {
    if (err) return handleMulterErrors(err, req, res, next);
    next();
  });
};

module.exports = { uploadVehicleImages };

// =============================================================
// END OF FILE: backend/src/middleware/upload.js
// =============================================================