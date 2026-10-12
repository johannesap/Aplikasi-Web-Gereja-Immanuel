import { Router } from 'express';
import * as c from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { authLimiter, loginLimiter } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';
import { changePasswordSchema, loginSchema, refreshSchema } from '../validators/schemas.js';

// Tidak ada endpoint registrasi: akun hanya dibuat oleh pengelola berizin users:manage atau skrip server.
export const authRoutes = Router()
  .post('/login', loginLimiter, validate(loginSchema), c.login)
  .post('/refresh', authLimiter, validate(refreshSchema), c.refresh)
  .post('/logout', authLimiter, validate(refreshSchema), c.logout)
  .get('/me', requireAuth, c.me)
  .post('/change-password', authLimiter, requireAuth, validate(changePasswordSchema), c.changePassword);
