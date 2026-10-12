import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { HttpError, conflict } from '../utils/errors.js';

const ALL_SEATS = Array.from({ length: env.maxAccounts }, (_, i) => i + 1);

// Mengaktifkan akun dengan mengambil kursi kosong (1..15). Indeks unik pada `seat` membuat dua request
// bersamaan tidak bisa mengambil kursi yang sama; yang kalah mencoba kursi berikutnya.
export async function saveWithSeat(user) {
  for (let attempt = 0; attempt < env.maxAccounts; attempt++) {
    const taken = new Set((await User.find({ seat: { $exists: true } }, 'seat').lean()).map((u) => u.seat));
    const free = ALL_SEATS.find((s) => !taken.has(s));
    if (!free) throw conflict(`Batas ${env.maxAccounts} akun pengelola aktif sudah tercapai`);
    user.seat = free;
    user.isActive = true;
    try {
      return await user.save();
    } catch (err) {
      if (err?.code === 11000 && err.keyPattern?.seat) continue;
      throw err;
    }
  }
  throw new HttpError(503, 'Server sedang sibuk, silakan coba lagi');
}

export async function releaseSeat(user) {
  user.isActive = false;
  user.seat = undefined;
  return user.save();
}
