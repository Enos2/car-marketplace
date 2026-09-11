// =============================================================
// FILE: backend/src/app.js
// =============================================================
// Purpose:
//   Express application entry point. Loads environment variables,
//   registers global middleware, mounts API routers, connects to
//   MongoDB, and starts the HTTP server. Also handles graceful
//   shutdown on SIGINT/SIGTERM.
//
// Conventions:
//   - All routes are mounted under /api
//   - Global middleware order: helmet → cors → body parsers →
//     cookie parser → rate limit → routes → error handler
//   - Business logic lives in controllers, not here
// =============================================================

'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const { connectDB, disconnectDB } = require('./config/db');
const vehicleRoutes = require('./routes/vehicleRoutes');

const app = express();

// ----- Security headers ---------------------------------------
app.use(helmet());

// ----- CORS (strict allowlist, credentials enabled) -----------
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// ----- Body parsers (tight limits per spec §17) ---------------
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ----- Cookies (for future session/refresh tokens) ------------
app.use(cookieParser());

// ----- Global rate limit --------------------------------------
// Permissive; tighten per-route later (auth, uploads, enquiries).
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// ----- Health check -------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

// ----- API routers --------------------------------------------
app.use('/api/vehicles', vehicleRoutes);

// ----- 404 for unknown API routes -----------------------------
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ----- Centralized error handler ------------------------------
// Must be last. Never leak stack traces in production.
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  console.error('[error]', err.message);
  res.status(err.status || 500).json({
    error:
      process.env.NODE_ENV === 'production'
        ? 'Server error'
        : err.message || 'Server error',
  });
});

// ----- Start server -------------------------------------------
const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`[server] API listening on http://localhost:${PORT}`);
  });

  const shutdown = async (signal) => {
    console.log(`[server] ${signal} received, shutting down`);
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start();

// =============================================================
// END OF FILE: backend/src/app.js
// =============================================================