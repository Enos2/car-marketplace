// =============================================================
// FILE: backend/src/controllers/metaController.js
// =============================================================
// Purpose:
//   Static metadata for filter dropdowns (spec §11). Hard-coded
//   for now; will become an admin-managed collection when the
//   admin UI needs to edit these values (spec §10).
//
//   Kept in one file so the migration to a Mongo-backed version
//   is a single-file change.
// =============================================================

'use strict';

const asyncHandler = require('../utils/asyncHandler');
const Vehicle = require('../models/Vehicle');

const MAKES = [
  'Toyota',
  'Nissan',
  'Subaru',
  'Mazda',
  'Honda',
  'Mitsubishi',
  'Isuzu',
  'Suzuki',
  'Volkswagen',
  'BMW',
  'Mercedes-Benz',
  'Audi',
  'Land Rover',
  'Ford',
  'Chevrolet',
  'Hyundai',
  'Kia',
  'Peugeot',
  'Renault',
  'Other',
];

const COUNTIES = [
  'Nairobi',
  'Mombasa',
  'Kisumu',
  'Nakuru',
  'Kiambu',
  'Machakos',
  'Kajiado',
  'Uasin Gishu',
  'Nyeri',
  'Meru',
  'Kakamega',
  'Kisii',
  'Other',
];

const PRICE_BANDS_KES = [
  { label: 'Under 500K', min: 0, max: 50_000_000 },
  { label: '500K – 1M', min: 50_000_000, max: 100_000_000 },
  { label: '1M – 2M', min: 100_000_000, max: 200_000_000 },
  { label: '2M – 5M', min: 200_000_000, max: 500_000_000 },
  { label: 'Over 5M', min: 500_000_000, max: null },
];

// -------- GET /api/meta -------------------------------------
// One call returns everything a filter sidebar needs.
const getMeta = asyncHandler(async (req, res) => {
  res.json({
    data: {
      makes: MAKES,
      counties: COUNTIES,
      bodyTypes: Vehicle.BODY_TYPE,
      fuelTypes: Vehicle.FUEL_TYPE,
      transmissions: Vehicle.TRANSMISSION,
      conditions: Vehicle.CONDITION,
      priceBandsKES: PRICE_BANDS_KES,
      currencies: ['KES', 'USD'],
    },
  });
});

// -------- GET /api/meta/makes -------------------------------
const getMakes = asyncHandler(async (req, res) => {
  res.json({ data: MAKES });
});

// -------- GET /api/meta/counties ----------------------------
const getCounties = asyncHandler(async (req, res) => {
  res.json({ data: COUNTIES });
});

module.exports = { getMeta, getMakes, getCounties };

// =============================================================
// END OF FILE: backend/src/controllers/metaController.js
// =============================================================