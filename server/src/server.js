import { createApp } from './app.js';
import { connectDb } from './config/db.js';
import { env } from './config/env.js';
import { getProfile } from './models/ChurchProfile.js';

await connectDb(env.mongoUri);
await getProfile(); // buat dokumen profil tunggal sebelum request bersamaan bisa membuat duplikat
createApp().listen(env.port, () => {
  console.log(`API POUK Immanuel berjalan di http://localhost:${env.port}`);
});
