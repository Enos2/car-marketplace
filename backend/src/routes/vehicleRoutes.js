// =============================================================
// FILE: backend/src/routes/vehicleRoutes.js
// =============================================================
// Purpose:
//   Route definitions for /api/vehicles. Mounted in app.js.
//   Only public read routes exist today. Write routes (create,
//   update, delete) will be added with authentication.
// =============================================================

'use strict';

const express = require('express');
const {
  listVehicles,
  getVehicleById,
} = require('../controllers/vehicleController');

const router = express.Router();

// GET /api/vehicles
router.get('/', listVehicles);

// GET /api/vehicles/:id
router.get('/:id', getVehicleById);

module.exports = router;

// =============================================================
// END OF FILE: backend/src/routes/vehicleRoutes.js
// =============================================================