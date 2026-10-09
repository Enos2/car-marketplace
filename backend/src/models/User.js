// =============================================================
// FILE: backend/src/models/User.js
// =============================================================
// Purpose:
//   User account model. Adds account lockout fields for the
//   security pass: failedLoginAttempts, lockedUntil.
// =============================================================

'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const { Schema } = mongoose;

const ROLES = ['buyer', 'seller', 'admin'];

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    phone: { type: String, trim: true, default: '' },

    passwordHash: { type: String, required: true, select: false },

    role: { type: String, enum: ROLES, default: 'buyer', index: true },

    verificationStatus: {
      type: String,
      enum: ['unverified', 'pending', 'verified', 'rejected'],
      default: 'unverified',
    },

    status: {
      type: String,
      enum: ['active', 'suspended'],
      default: 'active',
      index: true,
    },

    contactPreferences: {
      allowEnquiries: { type: Boolean, default: true },
      showEmail: { type: Boolean, default: false },
      showPhone: { type: Boolean, default: false },
      whatsappEnabled: { type: Boolean, default: false },
      emailNotifications: { type: Boolean, default: true },
    },

    // Seller viewing availability
    viewingAvailability: {
      days: { type: [Number], default: undefined },
      windows: {
        type: [{ start: { type: String }, end: { type: String } }],
        default: undefined,
      },
      slotMinutes: { type: Number, default: 60, min: 15, max: 480 },
      location: { type: String, trim: true, default: '' },
      feeMinor: { type: Number, default: 0, min: 0 },
      feeCurrency: { type: String, enum: ['KES', 'USD'], default: 'KES' },
    },

    lastLoginAt: { type: Date, default: null },

    // ---- Security: lockout -----------------------------------
    failedLoginAttempts: { type: Number, default: 0, min: 0 },
    lockedUntil: { type: Date, default: null },
    lastFailedAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false }
);

userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('passwordHash')) return;
  const salt = await bcrypt.genSalt(12);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
});

userSchema.methods.verifyPassword = function verifyPassword(plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

userSchema.methods.isLocked = function isLocked() {
  return this.lockedUntil && this.lockedUntil > new Date();
};

userSchema.methods.registerFailedLogin = function registerFailedLogin() {
  this.failedLoginAttempts = (this.failedLoginAttempts || 0) + 1;
  this.lastFailedAt = new Date();
  if (this.failedLoginAttempts >= 5) {
    // lock for 15 minutes after 5 failures
    this.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
  }
};

userSchema.methods.clearFailedLogins = function clearFailedLogins() {
  this.failedLoginAttempts = 0;
  this.lockedUntil = null;
  this.lastFailedAt = null;
};

userSchema.methods.toJSON = function toJSON() {
  const obj = this.toObject({ virtuals: false });
  delete obj.passwordHash;
  delete obj.failedLoginAttempts;
  delete obj.lockedUntil;
  delete obj.lastFailedAt;
  return obj;
};

const User = mongoose.model('User', userSchema);
User.ROLES = ROLES;

module.exports = User;

// =============================================================
// END OF FILE: backend/src/models/User.js
// =============================================================