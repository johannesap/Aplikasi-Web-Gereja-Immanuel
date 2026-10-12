function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Environment variable ${name} wajib diisi (lihat .env.example)`);
  return value;
}

const isTest = process.env.NODE_ENV === 'test';

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest,
  port: Number(process.env.PORT || 4000),
  mongoUri: isTest ? process.env.MONGODB_URI || '' : required('MONGODB_URI'),
  jwtAccessSecret: isTest ? 'test-secret-test-secret-test-secret' : required('JWT_ACCESS_SECRET'),
  accessTokenTtl: process.env.ACCESS_TOKEN_TTL || '15m',
  refreshTokenDays: Number(process.env.REFRESH_TOKEN_DAYS || 30),
  // Daftar origin dipisah koma; aplikasi mobile native tidak mengirim Origin, jadi ini hanya untuk klien web.
  corsOrigins: (process.env.CORS_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean),
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
  maxAccounts: 15,
};

if (env.isProduction && env.jwtAccessSecret.length < 32) {
  throw new Error('JWT_ACCESS_SECRET minimal 32 karakter di production');
}
