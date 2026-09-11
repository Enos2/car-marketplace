// =============================================================
// FILE: backend/src/jobs/seedVehicles.js
// =============================================================
// Purpose:
//   Development seed script. Wipes the `vehicles` collection and
//   inserts 5 realistic Kenya-market vehicle listings so the
//   frontend has data to render before the seller dashboard exists.
//
// Usage:
//   cd backend
//   node src/jobs/seedVehicles.js
//
// Safe to re-run: it deletes existing vehicles first.
// NEVER run this against production.
// =============================================================

'use strict';

require('dotenv').config();

const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../config/db');
const Vehicle = require('../models/Vehicle');

const SAMPLE_VEHICLES = [
  {
    make: 'Toyota',
    model: 'Harrier',
    trim: 'Premium',
    year: 2021,
    priceAmount: 520000000, // KES 5,200,000.00 in minor units
    priceCurrency: 'KES',
    negotiable: true,
    mileage: 45000,
    mileageUnit: 'km',
    condition: 'used',
    bodyType: 'suv',
    fuelType: 'petrol',
    transmission: 'automatic',
    location: { country: 'Kenya', county: 'Nairobi', city: 'Westlands' },
    description:
      'Locally used Toyota Harrier, well maintained, full service history. Accident-free.',
    features: ['Leather seats', 'Sunroof', 'Reverse camera', 'Cruise control'],
    status: 'published',
  },
  {
    make: 'Nissan',
    model: 'X-Trail',
    trim: 'Hybrid',
    year: 2020,
    priceAmount: 380000000, // KES 3,800,000.00
    priceCurrency: 'KES',
    negotiable: false,
    mileage: 62000,
    mileageUnit: 'km',
    condition: 'used',
    bodyType: 'suv',
    fuelType: 'hybrid',
    transmission: 'automatic',
    location: { country: 'Kenya', county: 'Nairobi', city: 'Karen' },
    description:
      'Nissan X-Trail Hybrid, imported 2022. Fuel efficient, clean interior, ready for transfer.',
    features: ['Alloy rims', 'Push start', 'Bluetooth', 'Keyless entry'],
    status: 'published',
  },
  {
    make: 'Subaru',
    model: 'Forester',
    trim: 'XT',
    year: 2019,
    priceAmount: 340000000, // KES 3,400,000.00
    priceCurrency: 'KES',
    negotiable: true,
    mileage: 78000,
    mileageUnit: 'km',
    condition: 'used',
    bodyType: 'suv',
    fuelType: 'petrol',
    transmission: 'automatic',
    location: { country: 'Kenya', county: 'Kiambu', city: 'Ruiru' },
    description:
      'Subaru Forester XT Turbo. Powerful, AWD, well serviced. Ideal for both city and upcountry.',
    features: ['Turbo', 'AWD', 'Paddle shifters', 'Roof rails'],
    status: 'published',
  },
  {
    make: 'Mazda',
    model: 'Demio',
    trim: 'Skyactiv',
    year: 2018,
    priceAmount: 135000000, // KES 1,350,000.00
    priceCurrency: 'KES',
    negotiable: true,
    mileage: 92000,
    mileageUnit: 'km',
    condition: 'used',
    bodyType: 'hatchback',
    fuelType: 'petrol',
    transmission: 'automatic',
    location: { country: 'Kenya', county: 'Nairobi', city: 'Kasarani' },
    description:
      'Mazda Demio, very economical, perfect first car or daily driver. New tyres.',
    features: ['Bluetooth', 'Reverse camera', 'Fabric seats'],
    status: 'published',
  },
  {
    make: 'Toyota',
    model: 'Land Cruiser Prado',
    trim: 'TX',
    year: 2022,
    priceAmount: 950000000, // KES 9,500,000.00
    priceCurrency: 'KES',
    negotiable: false,
    mileage: 28000,
    mileageUnit: 'km',
    condition: 'certified',
    bodyType: 'suv',
    fuelType: 'diesel',
    transmission: 'automatic',
    location: { country: 'Kenya', county: 'Nairobi', city: 'Kilimani' },
    description:
      'Toyota Prado TX, diesel, low mileage. Full dealer service history. Inspected and certified.',
    features: [
      'Leather seats',
      'Sunroof',
      '360 camera',
      'Heated seats',
      'Cruise control',
    ],
    status: 'published',
  },
];

async function seed() {
  try {
    await connectDB();

    if (process.env.NODE_ENV === 'production') {
      console.error('[seed] Refusing to run against production');
      await disconnectDB();
      process.exit(1);
    }

    const deleted = await Vehicle.deleteMany({});
    console.log(`[seed] Cleared ${deleted.deletedCount} existing vehicles`);

    const inserted = await Vehicle.insertMany(SAMPLE_VEHICLES);
    console.log(`[seed] Inserted ${inserted.length} vehicles`);

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
// END OF FILE: backend/src/jobs/seedVehicles.js
// =============================================================