// =============================================================
// FILE: backend/src/routes/savedSearchRoutes.js
// =============================================================
// Purpose:
//   Saved-search routes. All require auth; all operate on the
//   current user's own searches.
// =============================================================

'use strict';

const express = require('express');
const {
  createSavedSearch,
  listMySavedSearches,
  getMySavedSearch,
  updateMySavedSearch,
  deleteMySavedSearch,
} = require('../controllers/savedSearchController');
const {
  createRules,
  updateRules,
  idRule,
} = require('../validators/savedSearchValidators');
const validate = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.post('/', createRules, validate, createSavedSearch);
router.get('/', listMySavedSearches);
router.get('/:id', idRule, validate, getMySavedSearch);
router.patch('/:id', updateRules, validate, updateMySavedSearch);
router.delete('/:id', idRule, validate, deleteMySavedSearch);

module.exports = router;

// =============================================================
// END OF FILE: backend/src/routes/savedSearchRoutes.js
// =============================================================