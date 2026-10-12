# Arsitektur — Aplikasi POUK Immanuel Kopassus

## 1. Gambaran umum

```
┌──────────────────────┐      HTTPS / JSON      ┌───────────────────────┐      ┌─────────┐
│ mobile/ (Expo, RN)   │ ─────────────────────► │ server/ (Express 5)   │ ───► │ MongoDB │
│ Android + iOS        │  /api/public/*  (anon) │ REST, JWT, RBAC, Zod  │      └─────────┘
│ Expo Router, TanStack│  /api/auth/*           │ audit log, rate limit │ ───► uploads/ (gambar)
│ Query, SecureStore   │  /api/admin/* (Bearer) └───────────────────────┘
└──────────────────────┘
```

- **Jemaat**: tidak pernah login. Semua layar publik hanya memanggil `/api/public/*`, yang hanya mengembalikan konten berstatus `published`.
- **Pengelola** (maks. 15 akun aktif): login di menu *Lainnya → Login Pengelola*. Access token (JWT, 15 menit) disimpan di memori; refresh token (acak, 30 hari, dirotasi setiap dipakai) disimpan di `expo-secure-store`. Server hanya menyimpan **hash** refresh token di koleksi `sessions`.
- Semua otorisasi diperiksa di server (`middleware/auth.js`). Mobile hanya menyembunyikan tombol yang memang akan ditolak server.

### Keputusan teknis

| Keputusan | Alasan |
|---|---|
| `StyleSheet` + token tema (`src/theme.ts`), bukan NativeWind | NativeWind menambah pipeline Babel/Tailwind dan sering tertinggal dari rilis SDK Expo. Aplikasi ini hanya punya satu tema ungu–putih, jadi file token sudah cukup dan lebih stabil. |
| `Animated` bawaan React Native, bukan Reanimated | Animasi yang dibutuhkan hanya opacity/transform pada splash dan accordion; `useNativeDriver` sudah berjalan di thread native. Satu dependensi native lebih sedikit. |
| Express 5 | Error dari handler `async` otomatis diteruskan ke error handler pusat, jadi tidak perlu wrapper. |
| Batas 15 akun memakai **kursi** (`seat` 1–15) dengan indeks unik parsial | Aman untuk permintaan bersamaan tanpa transaksi/replica set: dua request yang berebut kursi yang sama akan ditolak oleh MongoDB (duplicate key), lalu dicoba kursi berikutnya. Akun nonaktif melepas kursinya. |
| Hak akses role di `server/src/config/permissions.js` | Satu tempat untuk mengatur apa yang boleh dilakukan Majelis dan Sekretariat, tanpa mengubah kode lain. |
| Gambar disimpan di disk server (`uploads/`), database hanya menyimpan URL | Paling sederhana untuk satu server. Kalau server di-hosting tanpa disk persisten, ganti `services/storage.js` ke object storage (S3/Cloudinary). |
| Zona waktu: tanggal disimpan UTC, ditampilkan sebagai WIB (UTC+7) | Asia/Jakarta tidak punya DST, jadi offset tetap +7 jam sudah tepat dan tidak bergantung pada dukungan `Intl` di Hermes. |

## 2. Struktur folder

```
mobile/
  app.json, package.json, .env.example
  assets/                 logo.png (placeholder, ganti dengan logo resmi), icon, splash
  src/
    app/                  rute Expo Router (setiap file = layar)
      _layout.tsx         provider (Query, Auth), splash animasi
      (tabs)/             Beranda, Acara, Tentang, Lainnya
      events/[id].tsx     detail acara
      commissions/[id].tsx
      commissions/index.tsx
      profile.tsx history.tsx faq.tsx login.tsx
      admin/              area pengelola (dijaga login)
        _layout.tsx index.tsx profile.tsx change-password.tsx audit.tsx
        users/index.tsx users/[id].tsx
        content/[resource]/index.tsx  content/[resource]/[id].tsx
    components/           ui.tsx, states.tsx, church.tsx, form.tsx, Screen.tsx, Intro.tsx
    lib/                  api.ts, auth.tsx, date.ts, filters.ts, queries.ts, resources.ts
    __tests__/            tes navigasi publik (jest-expo + expo-router/testing-library)
    theme.ts              design system
    types.ts
server/
  src/
    app.js server.js
    config/               env.js, db.js, permissions.js
    models/               User, Session, ChurchProfile, AuditLog, content.js (ChurchHistory, Commission, Event, Faq)
    routes/               public.routes.js, auth.routes.js, admin.routes.js
    controllers/          public, auth, content (CRUD generik), admin (dashboard, profil, audit, upload), users
    services/             auth.service.js, audit.service.js, seats.js, storage.js
    middleware/           auth.js, validate.js, error.js, rateLimit.js
    validators/           schemas.js (Zod)
    utils/                pagination.js, errors.js, slug.js
  scripts/                create-admin.js, reset-password.js, seed-demo.js
  test/                   *.test.js (node:test + supertest + mongodb-memory-server)
```

## 3. Peta navigasi

```
Splash (animasi singkat) ──► Tabs
  ├─ Beranda: header, hero, menu utama, acara mendatang, info gereja
  │     ├─► Profil Gereja
  │     ├─► Sejarah Gereja (pengantar + timeline)
  │     ├─► Komisi ─► Detail Komisi
  │     ├─► Acara (tab) ─► Detail Acara
  │     └─► FAQ
  ├─ Acara: filter Semua / Mendatang / Selesai, pencarian ─► Detail Acara
  ├─ Tentang: ringkasan profil ─► Profil, Sejarah, Komisi
  └─ Lainnya: FAQ, Kontak, Login Pengelola  (atau Dashboard Pengelola bila sudah login)
        └─► Login ─► (wajib ganti sandi bila sandi sementara) ─► Dashboard Pengelola
              ├─ Profil Gereja (form)
              ├─ Sejarah / Komisi / Acara / FAQ: daftar ─► form tambah/ubah, ubah status, hapus
              ├─ Pengguna (izin users:manage): daftar ─► tambah/ubah/nonaktifkan/reset sandi
              ├─ Riwayat Aktivitas (audit log)
              └─ Ganti Sandi, Keluar
```

## 4. Matriks hak akses (bawaan, ubah di `server/src/config/permissions.js`)

| Izin | Arti | Sekretariat | Majelis | Super admin* |
|---|---|:-:|:-:|:-:|
| `content:read` | Melihat area pengelola, termasuk draft | ✓ | ✓ | ✓ |
| `content:edit` | Tambah/ubah draft (sejarah, komisi, acara, FAQ) | ✓ | – | ✓ |
| `content:publish` | Publikasi / tarik publikasi, ubah konten yang sudah tayang | ✓ | ✓ | ✓ |
| `content:delete` | Hapus konten | ✓ | – | ✓ |
| `profile:edit` | Ubah profil gereja | ✓ | – | ✓ |
| `upload` | Unggah gambar | ✓ | – | ✓ |
| `audit:read` | Melihat riwayat aktivitas | ✓ | ✓ | ✓ |
| `users:manage` | Kelola akun pengelola | – | – | ✓ |

\* *Super admin* bukan role ketiga: itu tanda `isSuperAdmin` pada akun Majelis/Sekretariat yang hanya bisa diberikan lewat skrip server (`npm run create-admin`), tidak pernah lewat API.

Alur tinjauan: dengan pengaturan di atas Sekretariat bisa langsung publikasi. Jika gereja ingin setiap konten ditinjau Majelis dulu, hapus `content:publish` dari Sekretariat: Sekretariat menyimpan draft, Majelis mempublikasikannya.

## 5. Skema MongoDB

| Koleksi | Field utama | Indeks |
|---|---|---|
| `users` | name, email (unik, lowercase), passwordHash, role (`majelis`/`sekretariat`), isSuperAdmin, isActive, seat (1–15, hanya akun aktif), mustChangePassword, failedLogins, lockUntil, lastLoginAt | email unik; seat unik parsial |
| `sessions` | user, tokenHash, expiresAt, userAgent | tokenHash unik; TTL pada expiresAt |
| `churchprofiles` | (satu dokumen) name, shortDescription, description, logoUrl, photoUrl, heroImageUrl, welcomeMessage, historyIntro, address, phone, email, website, mapsUrl, socials{instagram,facebook,youtube}, additionalInfo, updatedBy | – |
| `churchhistories` | year, title, description, imageUrl, order, status, createdBy, updatedBy | status+order |
| `commissions` | name, slug, description, activities, schedule, contact, imageUrl, order, status, createdBy, updatedBy | slug unik; status+order |
| `events` | title, slug, description, startAt, endAt, location, imageUrl, contact, status, createdBy, updatedBy | slug unik; status+startAt (pencarian: regex judul/lokasi) |
| `faqs` | question, answer, category, order, status, createdBy, updatedBy | status+order |
| `auditlogs` | actor, actorName, action, entity, entityId, changes{before,after}, ip, createdAt | createdAt; entity+entityId |

Semua koleksi memakai `timestamps` (createdAt, updatedAt). Konten publik punya `status: draft | published`.

## 6. Design system ungu–putih

| Token | Nilai | Pemakaian |
|---|---|---|
| `primary` | `#5B2A86` | tombol utama, ikon aktif, tautan |
| `primaryDeep` | `#3B185F` | judul hero, teks di atas latar ungu muda |
| `primaryLight` | `#F2EAF8` | latar kartu menu, chip aktif, skeleton |
| `white` | `#FFFFFF` | latar utama |
| `text` | `#241C2B` | teks utama |
| `textMuted` | `#756B7D` | teks sekunder (kontras ≥ 4.5:1 di putih & softBg) |
| `softBg` | `#FAF8FC` | latar halaman; kartu tetap putih |
| `border` | `#E7DFED` | garis kartu & pemisah |
| `danger` / `success` | `#B3261E` / `#1E7A46` | hanya untuk status |

- Tipografi: font sistem (SF Pro di iOS, Roboto di Android, tanpa unduhan font); ukuran 14 (caption) · 16 (body) · 17 (subjudul) · 22 (judul) · 28 (hero). Teks mengikuti pengaturan ukuran font perangkat (maks. 1.4×).
- Spasi 4/8/12/16/24/32; radius kartu 16, tombol & input 14, hero 20; bayangan tunggal yang lembut. Isi maks. 720 dp di tablet.
- Komponen: `ChurchHeader`, `HeroSection`, `FeatureMenuCard` (home.tsx) · `EventCard`, `Accordion`, `ContactInfo`, `LinkCard` (church.tsx) · `Button`, `Card`, `Section`, `SearchBar`, `Chips`, `StatusBadge` (ui.tsx) · `EmptyState`, `ErrorState`, `Skeleton` (states.tsx) · `EventDetailView`, `CommissionDetailView` (details.tsx, juga untuk pratinjau pengelola) · navigasi bawah di `app/(tabs)/_layout.tsx`.
- Area sentuh minimal 48 dp; setiap ikon/tombol punya `accessibilityLabel`.
- Animasi: hanya opacity/transform (fade-in halaman 220 ms, kartu menu mengecil saat ditekan, accordion, splash ±1,2 dtk), dimatikan bila *Reduce Motion* aktif.

## 7. Urutan implementasi

1. Backend: model → auth/RBAC/kursi → API publik & admin → audit → tes.
2. Mobile: tema & komponen → layar publik → login & sesi → area pengelola.
3. Integrasi: `EXPO_PUBLIC_API_URL`, seed data demo, uji alur ujung-ke-ujung.
4. Dokumentasi & build (EAS).
