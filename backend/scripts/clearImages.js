// =============================================================
// FILE: backend/scripts/clearImages.js
// =============================================================
// Purpose:
//   One-off: removes the images array from every vehicle. Used
//   to wipe mismatched demo photos before real ones exist.
//
// Usage:
//   cd backend
//   node scripts/clearImages.js
// =============================================================

'use strict';

require('dotenv').config();

const { connectDB, disconnectDB } = require('../src/config/db');
const Vehicle = require('../src/models/Vehicle');

(async () => {
  try {
    await connectDB();
    const r = await Vehicle.updateMany({}, { $set: { images: [] } });
    console.log(`Cleared images from ${r.modifiedCount} vehicles`);
    await disconnectDB();
    process.exit(0);
  } catch (err) {
    console.error('Failed:', err.message);
    await disconnectDB();
    process.exit(1);
  }
})();

// =============================================================
// END OF FILE: backend/scripts/clearImages.js
// =============================================================