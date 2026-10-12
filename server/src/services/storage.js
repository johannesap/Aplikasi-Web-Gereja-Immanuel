import { randomBytes } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import multer from 'multer';
import { env } from '../config/env.js';
import { badRequest } from '../utils/errors.js';

const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

mkdirSync(env.uploadDir, { recursive: true });

// ponytail: gambar disimpan di disk server. Jika hosting tidak punya disk persisten (mis. container
// yang bisa di-redeploy), ganti storage ini ke S3/Cloudinary; field database tetap berisi URL.
export const imageUpload = multer({
  storage: multer.diskStorage({
    destination: env.uploadDir,
    filename: (_req, file, cb) => cb(null, `${Date.now()}-${randomBytes(8).toString('hex')}.${EXT[file.mimetype]}`),
  }),
  limits: { fileSize: 3 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (EXT[file.mimetype]) cb(null, true);
    else cb(badRequest('Format gambar harus JPG, PNG, atau WebP'));
  },
});

export const uploadUrl = (filename) => `/uploads/${filename}`;
