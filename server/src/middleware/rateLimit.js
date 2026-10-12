import { rateLimit } from 'express-rate-limit';
import { env } from '../config/env.js';

const make = (windowMs, limit, message) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skip: () => env.isTest,
    message: { error: { message } },
  });

export const generalLimiter = make(60_000, 300, 'Terlalu banyak permintaan, coba lagi sebentar lagi');
export const loginLimiter = make(15 * 60_000, 10, 'Terlalu banyak percobaan login, coba lagi dalam 15 menit');
export const authLimiter = make(15 * 60_000, 60, 'Terlalu banyak permintaan, coba lagi nanti');
