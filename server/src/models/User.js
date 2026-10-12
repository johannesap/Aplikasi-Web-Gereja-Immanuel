import mongoose from 'mongoose';
import { ROLES } from '../config/permissions.js';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 200 },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, required: true },
    // Hanya bisa diberikan lewat scripts/create-admin.js, tidak pernah lewat API.
    isSuperAdmin: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    // Kursi 1..15 untuk akun aktif. Indeks unik parsial menjamin batas 15 akun meski ada request bersamaan.
    seat: { type: Number, min: 1, max: 15 },
    mustChangePassword: { type: Boolean, default: true },
    failedLogins: { type: Number, default: 0, select: false },
    lockUntil: { type: Date, select: false },
    lastLoginAt: Date,
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.passwordHash;
        delete ret.failedLogins;
        delete ret.lockUntil;
        delete ret.__v;
        return ret;
      },
    },
  },
);

userSchema.index({ seat: 1 }, { unique: true, partialFilterExpression: { seat: { $exists: true } } });

export const User = mongoose.model('User', userSchema);
