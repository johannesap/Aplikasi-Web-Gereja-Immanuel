import mongoose from 'mongoose';

export async function connectDb(uri) {
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
  // Indeks unik (email, seat, slug) harus ada sebelum request pertama, karena batas 15 akun bergantung padanya.
  await mongoose.connection.syncIndexes();
}
