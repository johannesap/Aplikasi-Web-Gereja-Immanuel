import { Session } from '../models/Session.js';
import { User } from '../models/User.js';
import { audit } from '../services/audit.service.js';
import {
  DUMMY_HASH,
  hashPassword,
  hashToken,
  issueTokens,
  publicUser,
  revokeAllSessions,
  verifyPassword,
} from '../services/auth.service.js';
import { HttpError, badRequest, unauthorized } from '../utils/errors.js';

const MAX_FAILED = 5;
const LOCK_MS = 15 * 60_000;
const INVALID = 'Email atau kata sandi salah';

export async function login(req, res) {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+passwordHash +failedLogins +lockUntil');

  if (!user) {
    await verifyPassword(password, DUMMY_HASH);
    await audit(req, { action: 'login_failed', entity: 'auth', summary: `Email tidak terdaftar: ${email}` });
    throw unauthorized(INVALID);
  }
  if (user.lockUntil && user.lockUntil > new Date()) {
    throw new HttpError(429, 'Akun dikunci sementara karena terlalu banyak percobaan. Coba lagi dalam 15 menit.');
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok || !user.isActive) {
    if (!ok) {
      user.failedLogins += 1;
      if (user.failedLogins >= MAX_FAILED) {
        user.failedLogins = 0;
        user.lockUntil = new Date(Date.now() + LOCK_MS);
        await audit(req, { actor: user, action: 'account_locked', entity: 'auth', entityId: user._id });
      }
      await user.save();
    }
    await audit(req, { actor: user, action: 'login_failed', entity: 'auth', entityId: user._id });
    throw unauthorized(ok ? 'Akun tidak aktif. Hubungi administrator.' : INVALID);
  }

  user.failedLogins = 0;
  user.lockUntil = undefined;
  user.lastLoginAt = new Date();
  await user.save();
  const tokens = await issueTokens(user, req.get('user-agent'));
  await audit(req, { actor: user, action: 'login', entity: 'auth', entityId: user._id });
  res.json({ ...tokens, user: publicUser(user) });
}

// Rotasi: refresh token lama langsung dihapus, jadi setiap token hanya bisa dipakai sekali.
export async function refresh(req, res) {
  const session = await Session.findOneAndDelete({
    tokenHash: hashToken(req.body.refreshToken),
    expiresAt: { $gt: new Date() },
  });
  if (!session) throw unauthorized('Sesi berakhir, silakan login kembali');
  const user = await User.findById(session.user);
  if (!user?.isActive) throw unauthorized('Akun tidak aktif');
  const tokens = await issueTokens(user, req.get('user-agent'));
  res.json({ ...tokens, user: publicUser(user) });
}

export async function logout(req, res) {
  await Session.deleteOne({ tokenHash: hashToken(req.body.refreshToken) });
  res.status(204).end();
}

export function me(req, res) {
  res.json({ user: publicUser(req.user) });
}

export async function changePassword(req, res) {
  const user = await User.findById(req.user._id).select('+passwordHash');
  if (!(await verifyPassword(req.body.currentPassword, user.passwordHash))) {
    throw badRequest('Kata sandi saat ini salah');
  }
  if (req.body.currentPassword === req.body.newPassword) {
    throw badRequest('Kata sandi baru harus berbeda');
  }
  user.passwordHash = await hashPassword(req.body.newPassword);
  user.mustChangePassword = false;
  await user.save();
  // Semua sesi lain dicabut; perangkat ini mendapat sesi baru.
  await revokeAllSessions(user._id);
  const tokens = await issueTokens(user, req.get('user-agent'));
  await audit(req, { action: 'password_changed', entity: 'auth', entityId: user._id });
  res.json({ ...tokens, user: publicUser(user) });
}
