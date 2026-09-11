// =============================================================
// FILE: backend/src/config/db.js
// =============================================================
// Purpose:
//   Establishes and manages the MongoDB connection using Mongoose.
//   Imported once at startup (backend/src/app.js) before the HTTP
//   server begins listening.
//
// Behaviour:
//   - Reads the connection string from process.env.MONGODB_URI
//   - Fails fast with a clear error if the URI is missing
//   - Logs a single concise line on success (no URI, no secrets)
//   - Logs a clear error and exits the process on failure
//   - Reuses the same connection across hot reloads (nodemon)
//
// Security note:
//   Never log the raw connection string — it contains credentials.
//   Only the host portion is safe to log, and even that should be
//   avoided in production logs.
// =============================================================

'use strict';

const mongoose = require('mongoose');

/**
 * Connect to MongoDB.
 * @returns {Promise<typeof mongoose>} Resolves with the mongoose instance.
 */
async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri || typeof uri !== 'string' || uri.trim().length === 0) {
    console.error('[db] MONGODB_URI is not set. Check backend/.env');
    process.exit(1);
  }

  // Enable strict query mode so unknown query fields are ignored
  // rather than silently matching everything. Explicitly set to
  // suppress Mongoose v7+ deprecation warning.
  mongoose.set('strictQuery', true);

  try {
    await mongoose.connect(uri, {
      // Fail quickly instead of hanging if the cluster is unreachable.
      serverSelectionTimeoutMS: 10000,
    });

    console.log('[db] MongoDB connected');
    return mongoose;
  } catch (err) {
    console.error('[db] MongoDB connection failed:', err.message);
    process.exit(1);
  }
}

/**
 * Disconnect from MongoDB.
 * Called during graceful shutdown (backend/src/app.js).
 * @returns {Promise<void>}
 */
async function disconnectDB() {
  try {
    await mongoose.disconnect();
    console.log('[db] MongoDB disconnected');
  } catch (err) {
    console.error('[db] MongoDB disconnect failed:', err.message);
  }
}

module.exports = { connectDB, disconnectDB };

// =============================================================
// END OF FILE: backend/src/config/db.js
// =============================================================