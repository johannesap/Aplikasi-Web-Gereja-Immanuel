import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { audit } from '../services/audit.service.js';
import { generateTempPassword, hashPassword, revokeAllSessions } from '../services/auth.service.js';
import { releaseSeat, saveWithSeat } from '../services/seats.js';
import { badRequest, conflict, forbidden, notFound } from '../utils/errors.js';

async function findTarget(req) {
  const user = await User.findById(req.params.id);
  if (!user) throw notFound('Akun tidak ditemukan');
  if (user.isSuperAdmin && !req.user.isSuperAdmin) throw forbidden('Hanya super admin yang dapat mengubah akun super admin');
  return user;
}

export async function list(_req, res) {
  const users = await User.find().sort({ isActive: -1, name: 1 });
  const active = users.filter((u) => u.isActive).length;
  res.json({ items: users, activeCount: active, maxAccounts: env.maxAccounts });
}

// Akun baru selalu mendapat kata sandi sementara yang ditampilkan sekali, lalu wajib diganti saat login pertama.
export async function create(req, res) {
  if (await User.exists({ email: req.body.email })) throw conflict('Email sudah terdaftar');
  const tempPassword = generateTempPassword();
  const user = new User({ ...req.body, passwordHash: await hashPassword(tempPassword), mustChangePassword: true });
  try {
    await saveWithSeat(user);
  } catch (err) {
    if (err?.code === 11000 && err.keyPattern?.email) throw conflict('Email sudah terdaftar');
    throw err;
  }
  await audit(req, { action: 'create', entity: 'users', entityId: user._id, summary: user.email, after: user });
  res.status(201).json({ user, tempPassword });
}

export async function update(req, res) {
  const user = await findTarget(req);
  const isSelf = user._id.equals(req.user._id);
  if (isSelf && (req.body.isActive === false || (req.body.role && req.body.role !== user.role))) {
    throw badRequest('Anda tidak dapat menonaktifkan atau mengubah role akun sendiri');
  }
  const before = user.toObject();
  const { isActive, ...fields } = req.body;
  user.set(fields);

  if (isActive === true && !user.isActive) await saveWithSeat(user);
  else if (isActive === false && user.isActive) {
    await releaseSeat(user);
    await revokeAllSessions(user._id);
  } else await user.save();

  await audit(req, { action: 'update', entity: 'users', entityId: user._id, summary: user.email, before, after: user });
  res.json({ user });
}

export async function resetPassword(req, res) {
  const user = await findTarget(req);
  const tempPassword = generateTempPassword();
  user.passwordHash = await hashPassword(tempPassword);
  user.mustChangePassword = true;
  await user.save();
  await revokeAllSessions(user._id);
  await audit(req, { action: 'reset_password', entity: 'users', entityId: user._id, summary: user.email });
  res.json({ tempPassword });
}

export async function revokeSessions(req, res) {
  const user = await findTarget(req);
  await revokeAllSessions(user._id);
  await audit(req, { action: 'revoke_sessions', entity: 'users', entityId: user._id, summary: user.email });
  res.status(204).end();
}
