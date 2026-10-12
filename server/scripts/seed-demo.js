// DATA DEMONSTRASI untuk mencoba aplikasi. Bukan informasi resmi gereja.
// Semua teks diberi tanda [DEMO]. Jangan jalankan di database production.
// Pemakaian: npm run seed:demo        (menambah data demo)
//            npm run seed:demo -- --clear   (menghapus data demo)
import mongoose from 'mongoose';
import { connectDb } from '../src/config/db.js';
import { env } from '../src/config/env.js';
import { ChurchProfile, getProfile } from '../src/models/ChurchProfile.js';
import { ChurchHistory, Commission, Event, Faq } from '../src/models/content.js';
import { slugify } from '../src/utils/slug.js';

if (env.isProduction) {
  console.error('seed:demo tidak boleh dijalankan saat NODE_ENV=production');
  process.exit(1);
}

const DEMO = /^\[DEMO\]/;
const day = 86_400_000;
const at = (days, hourWib) => {
  const d = new Date(Date.now() + days * day);
  d.setUTCHours(hourWib - 7, 0, 0, 0);
  return d;
};

await connectDb(env.mongoUri);
try {
  await Promise.all([
    ChurchHistory.deleteMany({ title: DEMO }),
    Commission.deleteMany({ name: DEMO }),
    Event.deleteMany({ title: DEMO }),
    Faq.deleteMany({ question: DEMO }),
  ]);

  if (process.argv.includes('--clear')) {
    console.log('Data demo dihapus.');
  } else {
    const profile = await getProfile();
    await ChurchProfile.updateOne(
      { _id: profile._id },
      {
        $set: {
          shortDescription: '[DEMO] Deskripsi singkat gereja. Ganti melalui Dashboard Pengelola → Profil Gereja.',
          welcomeMessage: '[DEMO] Selamat datang, jemaat yang dikasihi Tuhan.',
          historyIntro: '[DEMO] Pengantar sejarah gereja akan diisi oleh Sekretariat.',
        },
      },
    );
    const published = { status: 'published' };
    await ChurchHistory.insertMany([
      { year: '[Tahun]', title: '[DEMO] Peristiwa pertama', description: 'Contoh entri timeline.', order: 1, ...published },
      { year: '[Tahun]', title: '[DEMO] Peristiwa kedua', description: 'Contoh entri timeline.', order: 2, ...published },
    ]);
    await Commission.insertMany(
      ['[DEMO] Komisi A', '[DEMO] Komisi B', '[DEMO] Komisi C (draft)'].map((name, i) => ({
        name,
        slug: slugify(name),
        description: 'Contoh deskripsi komisi.',
        activities: 'Contoh kegiatan utama.',
        order: i,
        status: name.includes('draft') ? 'draft' : 'published',
      })),
    );
    await Event.insertMany(
      [
        { title: '[DEMO] Acara mendatang', startAt: at(3, 9), endAt: at(3, 11), location: '[Lokasi]' },
        { title: '[DEMO] Acara bulan depan', startAt: at(30, 18), location: '[Lokasi]' },
        { title: '[DEMO] Acara yang sudah lewat', startAt: at(-10, 9), location: '[Lokasi]' },
      ].map((e) => ({ ...e, slug: slugify(e.title), description: 'Contoh deskripsi acara.', ...published })),
    );
    await Faq.insertMany([
      { question: '[DEMO] Contoh pertanyaan tentang gereja?', answer: 'Contoh jawaban.', category: 'Informasi gereja', ...published },
      { question: '[DEMO] Contoh pertanyaan tentang jadwal?', answer: 'Contoh jawaban.', category: 'Jadwal kegiatan', ...published },
    ]);
    console.log('Data demo ditambahkan (ditandai [DEMO]). Hapus dengan: npm run seed:demo -- --clear');
  }
} finally {
  await mongoose.disconnect();
}
