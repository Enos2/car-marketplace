// =============================================================
// FILE: backend/src/routes/metaRoutes.js
// =============================================================
// Purpose:
//   Public metadata endpoints for filter UI (spec §11). Cached
//   aggressively on the client because the values change rarely.
// =============================================================

'use strict';

const express = require('express');
const { getMeta, getMakes, getCounties } = require('../controllers/metaController');

const router = express.Router();

router.get('/', getMeta);
router.get('/makes', getMakes);
router.get('/counties', getCounties);

module.exports = router;

// =============================================================
// END OF FILE: backend/src/routes/metaRoutes.js
// =============================================================