import { createHash, randomBytes, randomInt } from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { permissionsFor } from '../config/permissions.js';
import { Session } from '../models/Session.js';

const BCRYPT_ROUNDS = env.isTest ? 4 : 12;

export const hashPassword = (plain) => bcrypt.hash(plain, BCRYPT_ROUNDS);
export const verifyPassword = (plain, hash) => bcrypt.compare(plain, hash);
// Dipakai saat email tidak ditemukan, supaya waktu respons sama dan email terdaftar tidak bisa ditebak.
export const DUMMY_HASH = bcrypt.hashSync('dummy-password-not-used', BCRYPT_ROUNDS);

export const hashToken = (token) => createHash('sha256').update(token).digest('hex');

// Kata sandi sementara yang mudah diketik, contoh: "Kd7m-Q2xp-9Rtw4". Angka di akhir memenuhi aturan sandi.
export function generateTempPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  const group = () => Array.from({ length: 4 }, () => chars[randomInt(chars.length)]).join('');
  return `${group()}-${group()}-${group()}${randomInt(2, 10)}`;
}

export async function issueTokens(user, userAgent) {
  const accessToken = jwt.sign({ sub: user.id, role: user.role }, env.jwtAccessSecret, {
    algorithm: 'HS256',
    expiresIn: env.accessTokenTtl,
  });
  const refreshToken = randomBytes(48).toString('base64url');
  await Session.create({
    user: user._id,
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(Date.now() + env.refreshTokenDays * 86_400_000),
    userAgent: userAgent?.slice(0, 300),
  });
  return { accessToken, refreshToken };
}

export const revokeAllSessions = (userId) => Session.deleteMany({ user: userId });

export function publicUser(user) {
  return { ...user.toJSON(), permissions: permissionsFor(user) };
}
