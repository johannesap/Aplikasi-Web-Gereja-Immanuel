// Membuat akun super admin pertama (atau tambahan). Hanya bisa dijalankan oleh orang yang punya akses ke server.
// Pemakaian: npm run create-admin -- --email admin@contoh.org --name "Nama Lengkap" --role sekretariat
import { parseArgs } from 'node:util';
import mongoose from 'mongoose';
import { connectDb } from '../src/config/db.js';
import { env } from '../src/config/env.js';
import { ROLES } from '../src/config/permissions.js';
import { User } from '../src/models/User.js';
import { generateTempPassword, hashPassword } from '../src/services/auth.service.js';
import { saveWithSeat } from '../src/services/seats.js';

const { values } = parseArgs({
  options: { email: { type: 'string' }, name: { type: 'string' }, role: { type: 'string', default: 'sekretariat' } },
});
const email = values.email?.trim().toLowerCase();
if (!email || !values.name || !ROLES.includes(values.role)) {
  console.error('Pemakaian: npm run create-admin -- --email <email> --name "<nama>" [--role sekretariat|majelis]');
  process.exit(1);
}

await connectDb(env.mongoUri);
try {
  if (await User.exists({ email })) throw new Error(`Email ${email} sudah terdaftar. Gunakan npm run reset-password.`);
  const tempPassword = generateTempPassword();
  const user = new User({
    email,
    name: values.name.trim(),
    role: values.role,
    isSuperAdmin: true,
    mustChangePassword: true,
    passwordHash: await hashPassword(tempPassword),
  });
  await saveWithSeat(user);
  console.log(`\nAkun super admin dibuat: ${email} (kursi ${user.seat}/${env.maxAccounts})`);
  console.log(`Kata sandi sementara: ${tempPassword}`);
  console.log('Berikan kata sandi ini secara langsung/pribadi. Wajib diganti saat login pertama.\n');
} catch (err) {
  console.error(`Gagal: ${err.message}`);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
