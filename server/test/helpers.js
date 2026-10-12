// Harus diimpor paling awal di setiap file tes: env.js membaca NODE_ENV saat pertama dimuat.
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

process.env.NODE_ENV = 'test';
process.env.UPLOAD_DIR = mkdtempSync(join(tmpdir(), 'pouk-uploads-'));

const { MongoMemoryServer } = await import('mongodb-memory-server');
const { default: mongoose } = await import('mongoose');
const { default: request } = await import('supertest');
const { createApp } = await import('../src/app.js');
const { connectDb } = await import('../src/config/db.js');
const { User } = await import('../src/models/User.js');
const { hashPassword } = await import('../src/services/auth.service.js');
const { saveWithSeat } = await import('../src/services/seats.js');

export const PASSWORD = 'RahasiaKuat123';
export const app = createApp();
export const api = () => request(app);
let mongo;

export async function start() {
  mongo = await MongoMemoryServer.create();
  await connectDb(mongo.getUri());
}

export async function stop() {
  await mongoose.disconnect();
  await mongo?.stop();
}

export async function reset() {
  await Promise.all(Object.values(mongoose.connection.collections).map((c) => c.deleteMany({})));
}

let n = 0;
// Membuat akun aktif yang sudah mengganti sandi, lalu login. Mengembalikan { user, token, refreshToken }.
export async function loginAs(role, extra = {}) {
  const user = new User({
    name: `${role} ${++n}`,
    email: `${role}${n}@test.local`,
    role,
    mustChangePassword: false,
    passwordHash: await hashPassword(PASSWORD),
    ...extra,
  });
  await saveWithSeat(user);
  const res = await api().post('/api/auth/login').send({ email: user.email, password: PASSWORD });
  if (res.status !== 200) throw new Error(`login gagal: ${res.status} ${JSON.stringify(res.body)}`);
  return { user, token: res.body.accessToken, refreshToken: res.body.refreshToken };
}

export const auth = (token) => ({ Authorization: `Bearer ${token}` });
