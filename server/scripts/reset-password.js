// Pemulihan akun dari server, mis. bila super admin satu-satunya lupa kata sandi.
// Pemakaian: npm run reset-password -- --email admin@contoh.org
import { parseArgs } from 'node:util';
import mongoose from 'mongoose';
import { connectDb } from '../src/config/db.js';
import { env } from '../src/config/env.js';
import { User } from '../src/models/User.js';
import { generateTempPassword, hashPassword, revokeAllSessions } from '../src/services/auth.service.js';

const { values } = parseArgs({ options: { email: { type: 'string' } } });
const email = values.email?.trim().toLowerCase();
if (!email) {
  console.error('Pemakaian: npm run reset-password -- --email <email>');
  process.exit(1);
}

await connectDb(env.mongoUri);
try {
  const user = await User.findOne({ email });
  if (!user) throw new Error(`Email ${email} tidak ditemukan`);
  const tempPassword = generateTempPassword();
  user.passwordHash = await hashPassword(tempPassword);
  user.mustChangePassword = true;
  user.failedLogins = 0;
  user.lockUntil = undefined;
  await user.save();
  await revokeAllSessions(user._id);
  console.log(`\nKata sandi sementara untuk ${email}: ${tempPassword}`);
  console.log(user.isActive ? 'Semua sesi lama telah dicabut.\n' : 'Catatan: akun ini nonaktif.\n');
} catch (err) {
  console.error(`Gagal: ${err.message}`);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
