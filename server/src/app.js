import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import { generalLimiter } from './middleware/rateLimit.js';
import { adminRoutes } from './routes/admin.routes.js';
import { authRoutes } from './routes/auth.routes.js';
import { publicRoutes } from './routes/public.routes.js';

export function createApp() {
  const app = express();
  // Jumlah proxy di depan server (mis. 1 untuk Nginx/Render) agar rate limit membaca IP asli.
  app.set('trust proxy', Number(process.env.TRUST_PROXY || 0));

  app.use(helmet());
  app.use(cors({ origin: env.corsOrigins.length ? env.corsOrigins : false }));
  app.use(express.json({ limit: '100kb' }));
  if (!env.isTest) app.use(morgan(env.isProduction ? 'combined' : 'dev'));

  app.use(
    '/uploads',
    helmet.crossOriginResourcePolicy({ policy: 'cross-origin' }),
    express.static(env.uploadDir, { maxAge: '30d', immutable: true, index: false }),
  );

  app.get('/api/health', (_req, res) => res.json({ ok: true }));
  app.use('/api', generalLimiter);
  app.use('/api/public', publicRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/admin', adminRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
