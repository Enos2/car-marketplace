// =============================================================
// FILE: backend/src/routes/authRoutes.js
// =============================================================
// Purpose:
//   Auth routes: register, login, logout, current user.
//   Strict rate limit on register/login (spec §17).
// =============================================================

'use strict';

const express = require('express');
const {
  register,
  login,
  logout,
  me,
} = require('../controllers/authController');
const {
  registerRules,
  loginRules,
} = require('../validators/authValidators');
const validate = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiters');

const router = express.Router();

router.post('/register', authLimiter, registerRules, validate, register);
router.post('/login', authLimiter, loginRules, validate, login);
router.post('/logout', logout);
router.get('/me', me);

module.exports = router;

// =============================================================
// END OF FILE: backend/src/routes/authRoutes.js
// =============================================================