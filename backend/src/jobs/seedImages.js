// =============================================================
// FILE: backend/src/jobs/seedImages.js
// =============================================================
// Purpose:
//   Attach demo stock photos to each seeded vehicle. Matches by
//   body class so no more Porsche-on-a-Forester mismatches.
//   Rotates the starting photo so consecutive vehicles don't
//   all get the same primary image.
//
// Usage:
//   cd backend
//   node src/jobs/seedImages.js
// =============================================================

'use strict';

require('dotenv').config();

const { connectDB, disconnectDB } = require('../config/db');
const Vehicle = require('../models/Vehicle');

const POOLS = {
  suv: [
    'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1200&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=1200&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=1200&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=1200&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=1200&q=80&auto=format&fit=crop',
  ],
  sedan: [
    'https://images.unsplash.com/photo-1550355291-bbee04a92027?w=1200&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=1200&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1493238792000-8113da705763?w=1200&q=80&auto=format&fit=crop',
  ],
  hatchback: [
    'https://images.unsplash.com/photo-1471444914096-34c7b8e8c2db?w=1200&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=1200&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1200&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=1200&q=80&auto=format&fit=crop',
  ],
  pickup: [
    'https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?w=1200&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1571607388263-1044f9ea01dd?w=1200&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1605893477799-b99e3b8b93fe?w=1200&q=80&auto=format&fit=crop',
  ],
};

const FALLBACK = [
  'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=1200&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1550355291-bbee04a92027?w=1200&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&q=80&auto=format&fit=crop',
];

function poolFor(bodyType) {
  return POOLS[bodyType] || FALLBACK;
}

function toImages(urls, seed) {
  return urls.map((url, i) => ({
    storageKey: `seed/${seed}-${i}`,
    url,
    width: 1200,
    height: 800,
    sizeBytes: 0,
    mimeType: 'image/jpeg',
    isPrimary: i === 0,
    order: i,
  }));
}

async function seed() {
  try {
    await connectDB();

    if (process.env.NODE_ENV === 'production') {
      console.error('[seedImages] Refusing to run in production');
      await disconnectDB();
      process.exit(1);
    }

    const vehicles = await Vehicle.find({}).select('_id make model bodyType');
    if (vehicles.length === 0) {
      console.log('[seedImages] No vehicles found. Run seedVehicles first.');
      await disconnectDB();
      process.exit(0);
    }

    for (let i = 0; i < vehicles.length; i++) {
      const v = vehicles[i];
      const pool = poolFor(v.bodyType);

      // Rotate the starting position so consecutive vehicles get
      // different primary photos even if they share a body class.
      const offset = i % pool.length;
      const pickCount = Math.min(3, pool.length);
      const urls = [];
      for (let j = 0; j < pickCount; j++) {
        urls.push(pool[(offset + j) % pool.length]);
      }

      const images = toImages(urls, String(v._id).slice(-6));
      await Vehicle.updateOne({ _id: v._id }, { $set: { images } });
      console.log(
        `[seedImages] ${v.make} ${v.model} (${v.bodyType || 'unknown'}) → starting at photo ${offset + 1}`
      );
    }

    console.log(`[seedImages] Done. Updated ${vehicles.length} vehicles.`);
    await disconnectDB();
    process.exit(0);
  } catch (err) {
    console.error('[seedImages] Failed:', err.message);
    await disconnectDB();
    process.exit(1);
  }
}

seed();

// =============================================================
// END OF FILE: backend/src/jobs/seedImages.js
// =============================================================