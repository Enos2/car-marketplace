// =============================================================
// FILE: backend/src/jobs/seedVehicles.js
// =============================================================
// Purpose:
//   Development seed for vehicle listings. Creates sample
//   vehicles owned by a placeholder seller so the public feed
//   is not empty during early development.
//
// Usage:
//   cd backend
//   node src/jobs/seedVehicles.js
//
// Safe to re-run: clears existing vehicles first.
// =============================================================

'use strict';

require('dotenv').config();

const { connectDB, disconnectDB } = require('../config/db');
const Vehicle = require('../models/Vehicle');
const User = require('../models/User');
const SellerProfile = require('../models/SellerProfile');

const SELLER_EMAIL = 'demo.seller@car-marketplace.local';
const SELLER_PASSWORD = 'DemoSeller!2026'; // dev-only

async function ensureDemoSeller() {
  let seller = await User.findOne({ email: SELLER_EMAIL });
  if (!seller) {
    seller = await User.create({
      name: 'Demo Motors',
      email: SELLER_EMAIL,
      passwordHash: SELLER_PASSWORD,
      role: 'seller',
      verificationStatus: 'verified',
    });
    await SellerProfile.create({
      user: seller._id,
      sellerType: 'dealer',
      businessName: 'Demo Motors Ltd',
      about: 'Sample dealership account used for development data.',
      location: { country: 'Kenya', county: 'Nairobi', city: 'Westlands' },
      publicEmail: SELLER_EMAIL,
      publicPhone: '+254700000000',
    });
    console.log(`[seed] Created demo seller: ${SELLER_EMAIL}`);
  }
  return seller;
}

const SAMPLE_VEHICLES = [
  {
    make: 'Toyota', model: 'Harrier', trim: 'Premium', year: 2021,
    priceAmount: 520000000, priceCurrency: 'KES', negotiable: true,
    mileage: 45000, mileageUnit: 'km', condition: 'used',
    bodyType: 'suv', fuelType: 'petrol', transmission: 'automatic',
    location: { country: 'Kenya', county: 'Nairobi', city: 'Westlands' },
    description: 'Locally used Toyota Harrier, well maintained, full service history. Accident-free.',
    features: ['Leather seats', 'Sunroof', 'Reverse camera', 'Cruise control'],
  },
  {
    make: 'Nissan', model: 'X-Trail', trim: 'Hybrid', year: 2020,
    priceAmount: 380000000, priceCurrency: 'KES', negotiable: false,
    mileage: 62000, mileageUnit: 'km', condition: 'used',
    bodyType: 'suv', fuelType: 'hybrid', transmission: 'automatic',
    location: { country: 'Kenya', county: 'Nairobi', city: 'Karen' },
    description: 'Nissan X-Trail Hybrid, imported 2022. Fuel efficient, clean interior, ready for transfer.',
    features: ['Alloy rims', 'Push start', 'Bluetooth', 'Keyless entry'],
  },
  {
    make: 'Subaru', model: 'Forester', trim: 'XT', year: 2019,
    priceAmount: 340000000, priceCurrency: 'KES', negotiable: true,
    mileage: 78000, mileageUnit: 'km', condition: 'used',
    bodyType: 'suv', fuelType: 'petrol', transmission: 'automatic',
    location: { country: 'Kenya', county: 'Kiambu', city: 'Ruiru' },
    description: 'Subaru Forester XT Turbo. Powerful, AWD, well serviced. Ideal for both city and upcountry.',
    features: ['Turbo', 'AWD', 'Paddle shifters', 'Roof rails'],
  },
  {
    make: 'Mazda', model: 'Demio', trim: 'Skyactiv', year: 2018,
    priceAmount: 135000000, priceCurrency: 'KES', negotiable: true,
    mileage: 92000, mileageUnit: 'km', condition: 'used',
    bodyType: 'hatchback', fuelType: 'petrol', transmission: 'automatic',
    location: { country: 'Kenya', county: 'Nairobi', city: 'Kasarani' },
    description: 'Mazda Demio, very economical, perfect first car or daily driver. New tyres.',
    features: ['Bluetooth', 'Reverse camera', 'Fabric seats'],
  },
  {
    make: 'Toyota', model: 'Land Cruiser Prado', trim: 'TX', year: 2022,
    priceAmount: 950000000, priceCurrency: 'KES', negotiable: false,
    mileage: 28000, mileageUnit: 'km', condition: 'certified',
    bodyType: 'suv', fuelType: 'diesel', transmission: 'automatic',
    location: { country: 'Kenya', county: 'Nairobi', city: 'Kilimani' },
    description: 'Toyota Prado TX, diesel, low mileage. Full dealer service history. Inspected and certified.',
    features: ['Leather seats', 'Sunroof', '360 camera', 'Heated seats', 'Cruise control'],
  },
  {
    make: 'Honda', model: 'Fit', trim: 'Hybrid', year: 2017,
    priceAmount: 115000000, priceCurrency: 'KES', negotiable: true,
    mileage: 105000, mileageUnit: 'km', condition: 'used',
    bodyType: 'hatchback', fuelType: 'hybrid', transmission: 'automatic',
    location: { country: 'Kenya', county: 'Nairobi', city: 'Embakasi' },
    description: 'Honda Fit Hybrid. Very economical, ideal for town. Clean interior.',
    features: ['Bluetooth', 'Reverse camera'],
  },
  {
    make: 'Toyota', model: 'Hilux', trim: 'Double Cab', year: 2020,
    priceAmount: 620000000, priceCurrency: 'KES', negotiable: true,
    mileage: 85000, mileageUnit: 'km', condition: 'used',
    bodyType: 'pickup', fuelType: 'diesel', transmission: 'manual',
    location: { country: 'Kenya', county: 'Nakuru', city: 'Nakuru' },
    description: 'Toyota Hilux Double Cab, 4WD, diesel. Ideal for both work and family.',
    features: ['4WD', 'Bull bar', 'Roll bar', 'Tow hitch'],
  },
  {
    make: 'Mercedes-Benz', model: 'C200', trim: 'AMG Line', year: 2019,
    priceAmount: 490000000, priceCurrency: 'KES', negotiable: false,
    mileage: 55000, mileageUnit: 'km', condition: 'used',
    bodyType: 'sedan', fuelType: 'petrol', transmission: 'automatic',
    location: { country: 'Kenya', county: 'Nairobi', city: 'Lavington' },
    description: 'Mercedes C200 AMG Line. Elegant, well maintained, full service history.',
    features: ['Leather seats', 'Ambient lighting', 'Panoramic roof', 'Reverse camera'],
  },
  {
    make: 'BMW', model: 'X3', trim: 'xDrive20d', year: 2020,
    priceAmount: 620000000, priceCurrency: 'KES', negotiable: true,
    mileage: 48000, mileageUnit: 'km', condition: 'used',
    bodyType: 'suv', fuelType: 'diesel', transmission: 'automatic',
    location: { country: 'Kenya', county: 'Nairobi', city: 'Muthaiga' },
    description: 'BMW X3 xDrive20d. Diesel, AWD, low mileage. Loaded with options.',
    features: ['AWD', 'Leather seats', 'Sunroof', 'Heated seats', '360 camera'],
  },
  {
    make: 'Volkswagen', model: 'Golf', trim: 'GTI', year: 2018,
    priceAmount: 310000000, priceCurrency: 'KES', negotiable: true,
    mileage: 72000, mileageUnit: 'km', condition: 'used',
    bodyType: 'hatchback', fuelType: 'petrol', transmission: 'automatic',
    location: { country: 'Kenya', county: 'Nairobi', city: 'Parklands' },
    description: 'VW Golf GTI. Performance hatch, well cared for. Iconic driver\u2019s car.',
    features: ['Turbo', 'Sports seats', 'Paddle shifters'],
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

    const seller = await ensureDemoSeller();

    const deleted = await Vehicle.deleteMany({});
    console.log(`[seed] Cleared ${deleted.deletedCount} existing vehicles`);

    const now = new Date();
    const withSeller = SAMPLE_VEHICLES.map((v, i) => ({
      ...v,
      seller: seller._id,
      status: 'published',
      publishedAt: new Date(now.getTime() - i * 3600 * 1000),
      images: [],
    }));

    const inserted = await Vehicle.insertMany(withSeller);
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