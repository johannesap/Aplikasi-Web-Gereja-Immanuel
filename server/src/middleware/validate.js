import { badRequest } from '../utils/errors.js';

// Mengganti req.body dengan data yang sudah divalidasi, jadi field asing tidak pernah sampai ke database.
export const validate = (schema) => (req, _res, next) => {
  const result = schema.safeParse(req.body ?? {});
  if (!result.success) {
    const details = result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
    return next(badRequest(details[0]?.message || 'Data tidak valid', details));
  }
  req.body = result.data;
  next();
};
