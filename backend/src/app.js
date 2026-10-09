// =============================================================
// FILE: backend/src/app.js
// =============================================================
// Purpose:
//   Express entry. Global sanitization middleware, tighter CSP,
//   attachUser, both crons.
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
const { attachUser } = require('./middleware/auth');
const { sanitizeBody } = require('./middleware/validate');
const logger = require('./utils/logger');
const viewingSweepCron = require('./jobs/viewingSweepCron');
const auctionSweepCron = require('./jobs/auctionSweepCron');

const app = express();

if (env.isProd) app.set('trust proxy', 1);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'self'"],
        "img-src": ["'self'", 'data:', 'https:'],
        "script-src": ["'self'"],
        "style-src": ["'self'", "'unsafe-inline'", 'https:'],
        "font-src": ["'self'", 'https:', 'data:'],
        "frame-ancestors": ["'self'"],
        "form-action": ["'self'"],
        "base-uri": ["'self'"],
      },
    },
  })
);

app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser(env.SESSION_SECRET));
app.use(sanitizeBody);
app.use(attachUser);

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 600,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

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

app.use('/api', apiRoutes);
app.use(notFound);
app.use(errorHandler);

async function start() {
  await connectDB();
  const server = app.listen(env.PORT, () => {
    logger.info('API listening', { port: env.PORT, env: env.NODE_ENV });
  });
  viewingSweepCron.start();
  auctionSweepCron.start();

  const shutdown = async (signal) => {
    logger.info('Shutting down', { signal });
    viewingSweepCron.stop();
    auctionSweepCron.stop();
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