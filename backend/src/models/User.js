// =============================================================
// FILE: backend/src/models/User.js
// =============================================================
// Purpose:
//   User account model. Covers buyers, sellers/dealers, admins.
//   Passwords hashed with bcrypt; never returned by default.
//
// Roles:
//   - 'buyer'   : browse, favorite, enquire
//   - 'seller'  : create listings, manage inquiries
//   - 'admin'   : moderate listings, manage users
//
// Security:
//   passwordHash has `select:false` so it never leaves the DB
//   unless explicitly requested.
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

    // Seller verification status (spec §20). Only meaningful for role=seller.
    verificationStatus: {
      type: String,
      enum: ['unverified', 'pending', 'verified', 'rejected'],
      default: 'unverified',
    },

    // Account status
    status: {
      type: String,
      enum: ['active', 'suspended'],
      default: 'active',
      index: true,
    },

    // Contact preferences (spec §8, §21)
    contactPreferences: {
      allowEnquiries: { type: Boolean, default: true },
      showEmail: { type: Boolean, default: false },
      showPhone: { type: Boolean, default: false },
      whatsappEnabled: { type: Boolean, default: false },
      emailNotifications: { type: Boolean, default: true },
    },

    lastLoginAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Hash password before save when set/changed.
userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('passwordHash')) return;
  const salt = await bcrypt.genSalt(12);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
});

userSchema.methods.verifyPassword = function verifyPassword(plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

userSchema.methods.toJSON = function toJSON() {
  const obj = this.toObject({ virtuals: false });
  delete obj.passwordHash;
  return obj;
};

const User = mongoose.model('User', userSchema);
User.ROLES = ROLES;

module.exports = User;

// =============================================================
// END OF FILE: backend/src/models/User.js
// =============================================================