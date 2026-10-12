import mongoose from 'mongoose';
import multer from 'multer';
import { HttpError } from '../utils/errors.js';

export function notFoundHandler(_req, res) {
  res.status(404).json({ error: { message: 'Endpoint tidak ditemukan' } });
}

export function errorHandler(err, _req, res, _next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: { message: err.message, details: err.details } });
  }
  if (err instanceof mongoose.Error.CastError) {
    return res.status(404).json({ error: { message: 'Data tidak ditemukan' } });
  }
  if (err instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({ error: { message: 'Data tidak valid' } });
  }
  if (err instanceof multer.MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE' ? 'Ukuran gambar maksimal 3 MB' : 'Unggahan tidak valid';
    return res.status(400).json({ error: { message } });
  }
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: { message: 'Format JSON tidak valid' } });
  }
  console.error(err);
  res.status(500).json({ error: { message: 'Terjadi kesalahan pada server' } });
}
