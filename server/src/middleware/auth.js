import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { permissionsFor } from '../config/permissions.js';
import { User } from '../models/User.js';
import { forbidden, unauthorized } from '../utils/errors.js';

// Memuat user dari database setiap request (hanya 15 akun) supaya penonaktifan berlaku seketika.
export async function requireAuth(req, _res, next) {
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next(unauthorized());

  let payload;
  try {
    payload = jwt.verify(token, env.jwtAccessSecret, { algorithms: ['HS256'] });
  } catch {
    return next(unauthorized('Sesi berakhir, silakan login kembali'));
  }

  const user = await User.findById(payload.sub);
  if (!user || !user.isActive) return next(unauthorized('Akun tidak aktif'));

  req.user = user;
  req.permissions = permissionsFor(user);
  next();
}

// Akun dengan kata sandi sementara hanya boleh mengganti kata sandi.
export function requirePasswordChanged(req, _res, next) {
  if (req.user.mustChangePassword) return next(forbidden('Silakan ganti kata sandi sementara terlebih dahulu'));
  next();
}

export const can = (req, permission) => req.permissions.includes(permission);

export const requirePermission = (...permissions) => (req, _res, next) => {
  if (!permissions.every((p) => can(req, p))) return next(forbidden());
  next();
};
