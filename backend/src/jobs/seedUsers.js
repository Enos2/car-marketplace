// =============================================================
// FILE: backend/src/jobs/seedUsers.js
// =============================================================
// Purpose:
//   Creates the initial admin account (and optionally a buyer
//   test account). Safe to re-run: skips accounts that already
//   exist. Does NOT delete existing users.
//
// Usage:
//   cd backend
//   node src/jobs/seedUsers.js
//
// Credentials are hardcoded for development only. Change them
// immediately after first login, or set them via env before
// running this against a shared environment.
// =============================================================

'use strict';

require('dotenv').config();

const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const SellerProfile = require('../models/SellerProfile');

const ADMIN_EMAIL = 'admin@car-marketplace.local';
const ADMIN_PASSWORD = 'Admin!2026Demo';
const ADMIN_NAME = 'Platform Admin';

const BUYER_EMAIL = 'buyer@car-marketplace.local';
const BUYER_PASSWORD = 'Buyer!2026Demo';
const BUYER_NAME = 'Demo Buyer';

async function upsertUser({ name, email, password, role, verificationStatus }) {
  let user = await User.findOne({ email });
  if (user) {
    console.log(`[seed] User already exists: ${email}`);
    return user;
  }
  user = await User.create({
    name,
    email,
    passwordHash: password,
    role,
    verificationStatus: verificationStatus || 'unverified',
  });
  console.log(`[seed] Created ${role}: ${email}`);
  if (role === 'seller') {
    await SellerProfile.create({ user: user._id, sellerType: 'private' });
  }
  return user;
}

async function seed() {
  try {
    await connectDB();

    if (process.env.NODE_ENV === 'production') {
      console.error('[seed] Refusing to run against production');
      await disconnectDB();
      process.exit(1);
    }

    await upsertUser({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      role: 'admin',
    });

    await upsertUser({
      name: BUYER_NAME,
      email: BUYER_EMAIL,
      password: BUYER_PASSWORD,
      role: 'buyer',
    });

    console.log('[seed] Done.');
    console.log('[seed] Admin login: ', ADMIN_EMAIL, '/', ADMIN_PASSWORD);
    console.log('[seed] Buyer login: ', BUYER_EMAIL, '/', BUYER_PASSWORD);

    await disconnectDB();
    process.exit(0);
  } catch (err) {
    console.error('[seed] Failed:', err.message);
    await disconnectDB();
    process.exit(1);
  }
}

seed();

// =============================================================
// END OF FILE: backend/src/jobs/seedUsers.js
// =============================================================