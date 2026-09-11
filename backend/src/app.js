// =============================================================
// FILE: backend/src/app.js
// =============================================================
// Purpose:
//   Express application entry point. Loads env, registers global
//   middleware, mounts all API routes under /api, serves uploaded
//   media in development, connects to MongoDB, starts the HTTP
//   server and the viewing-sweep cron job. Handles graceful
//   shutdown.
// =============================================================

'use strict';

require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const env = require('./config/env');
const { connectDB, disconnectDB } = require('./config/db');
const apiRoutes = require('./routes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');
const viewingSweepCron = require('./jobs/viewingSweepCron');

const app = express();

if (env.isProd) app.set('trust proxy', 1);

// ----- Security headers --------------------------------------
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// ----- CORS --------------------------------------------------
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  })
);

// ----- Body parsers ------------------------------------------
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ----- Cookies -----------------------------------------------
app.use(cookieParser(env.SESSION_SECRET));

// ----- Global rate limit -------------------------------------
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 600,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// ----- Static uploads (dev only) -----------------------------
if (env.isDev) {
  app.use(
    '/uploads',
    express.static(path.join(__dirname, '..', 'uploads'), {
      maxAge: '1h',
      index: false,
      dotfiles: 'deny',
    })
  );
}

// ----- API routes --------------------------------------------
app.use('/api', apiRoutes);

// ----- 404 + error handling ----------------------------------
app.use(notFound);
app.use(errorHandler);

// ----- Start server ------------------------------------------
async function start() {
  await connectDB();

  const server = app.listen(env.PORT, () => {
    logger.info('API listening', { port: env.PORT, env: env.NODE_ENV });
  });

  // Start the receipt-review sweep job.
  viewingSweepCron.start();

  const shutdown = async (signal) => {
    logger.info('Shutting down', { signal });
    viewingSweepCron.stop();
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start();

module.exports = app;

// =============================================================
// END OF FILE: backend/src/app.js
// =============================================================