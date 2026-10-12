# Aplikasi Mobile Gereja POUK Immanuel Kopassus

Aplikasi informasi gereja untuk Android dan iOS. **Jemaat tidak perlu login.** Hanya maksimal 15 akun Majelis/Sekretariat yang bisa masuk ke Dashboard Pengelola untuk mengelola konten.

```
mobile/   Expo SDK 57 · React Native 0.86 · TypeScript · Expo Router · TanStack Query · React Hook Form + Zod
server/   Node.js ≥ 20 · Express 5 · MongoDB (Mongoose 9) · JWT + refresh token · RBAC · audit log
docs/     ARSITEKTUR.md (arsitektur, navigasi, hak akses, skema, design system) · API.md (endpoint)
```

> **Tentang isi konten:** aplikasi ini tidak berisi sejarah, alamat, jadwal, atau identitas gereja yang dikarang. Field yang belum diisi tampil sebagai *"belum diisi oleh Sekretariat"*. Logo di `mobile/assets/` adalah **placeholder** (salib putih di lingkaran ungu); ganti dengan logo resmi.

---

## 1. Persiapan

- Node.js 20 atau lebih baru (`node -v`)
- MongoDB 7+ — salah satu:
  - **Lokal:** pasang [MongoDB Community Server](https://www.mongodb.com/try/download/community), lalu `MONGODB_URI=mongodb://127.0.0.1:27017/pouk_immanuel`
  - **Cloud:** buat cluster gratis di [MongoDB Atlas](https://www.mongodb.com/atlas), buat user database, izinkan IP server, lalu salin connection string `mongodb+srv://...`
- Untuk mencoba di HP: aplikasi **Expo Go** atau development build (lihat bagian 5)

## 2. Menjalankan backend

```bash
cd server
npm install
cp .env.example .env          # Windows: copy .env.example .env
```

Isi `.env`, minimal `MONGODB_URI` dan `JWT_ACCESS_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

```bash
npm run dev                   # http://localhost:4000, cek: http://localhost:4000/api/health
```

### Membuat akun pengelola pertama

Tidak ada registrasi publik. Akun pertama (super admin) dibuat dari server:

```bash
npm run create-admin -- --email sekretariat@contoh.org --name "Nama Lengkap" --role sekretariat
```

Skrip ini mencetak **kata sandi sementara** satu kali. Berikan secara langsung kepada pemilik akun. Saat login pertama, pemilik akun wajib menggantinya (min. 10 karakter, huruf + angka). Super admin kemudian bisa menambah hingga total 15 akun aktif dari aplikasi (*Dashboard → Akun Pengelola*).

**Pemulihan akun:**
- Pengelola lupa sandi → super admin membuka *Akun Pengelola → (nama) → Atur ulang kata sandi*.
- Super admin lupa sandi → dari server: `npm run reset-password -- --email <email>`.

Keduanya membuat sandi sementara baru dan mengeluarkan akun dari semua perangkat.

### Data demo (opsional, hanya development)

```bash
npm run seed:demo             # menambah contoh konten bertanda [DEMO]
npm run seed:demo -- --clear  # menghapusnya
```

Skrip menolak berjalan bila `NODE_ENV=production`.

### Tes backend

```bash
npm test
```

22 tes (node:test + supertest + MongoDB in-memory, tanpa perlu MongoDB terpasang): login, rotasi refresh token, penguncian akun, penolakan tanpa token, perbedaan izin Majelis/Sekretariat, batas 15 akun (termasuk 20 permintaan bersamaan), CRUD + audit log, validasi input, filter & pencarian acara, draft tidak tampil di publik, unggah gambar.

## 3. Menjalankan aplikasi mobile

```bash
cd mobile
npm install
cp .env.example .env          # atur EXPO_PUBLIC_API_URL
npx expo start
```

| Perangkat | `EXPO_PUBLIC_API_URL` |
|---|---|
| Emulator Android | `http://10.0.2.2:4000` |
| Simulator iOS | `http://localhost:4000` |
| HP fisik (Wi-Fi sama) | `http://<IP-laptop>:4000` |

Tekan `a` (Android) / `i` (iOS) atau pindai QR dengan Expo Go. Semua modul native yang dipakai sudah termasuk di Expo Go SDK 57.

```bash
npm run typecheck             # TypeScript
npm test                      # 17 tes: tanggal WIB, pencarian FAQ, klien API/refresh token, navigasi publik tanpa login
```

### Mengatur hak akses

Ubah `server/src/config/permissions.js`. Contohnya, agar setiap konten **ditinjau Majelis sebelum tayang**, hapus `'content:publish'` dari `sekretariat`. Sekretariat tetap bisa menyimpan draft, sedangkan Majelis mempublikasikannya. Matriks lengkapnya ada di [docs/ARSITEKTUR.md](docs/ARSITEKTUR.md#4-matriks-hak-akses-bawaan-ubah-di-serversrcconfigpermissionsjs).

### Mengganti logo dan ikon

Timpa file berikut dengan logo resmi (PNG, latar transparan kecuali `icon.png`):

| File | Ukuran | Dipakai untuk |
|---|---|---|
| `mobile/assets/logo.png` | 512×512 | logo di dalam aplikasi |
| `mobile/assets/splash-icon.png` | 512×512 | splash screen |
| `mobile/assets/icon.png` | 1024×1024, latar putih | ikon aplikasi iOS |
| `mobile/assets/android-icon-foreground.png` | 1024×1024, logo di area tengah ±60% | ikon adaptif Android |

Atau unggah logo lewat *Dashboard → Profil Gereja → Logo*. Logo dari server akan menggantikan `logo.png` di dalam aplikasi.

## 4. Hosting backend (Render + MongoDB Atlas)

Blueprint [render.yaml](render.yaml) menyiapkan API di region Singapore, HTTPS bawaan Render, health check, secret JWT acak, dan disk persisten 1 GB untuk gambar unggahan. Disk persisten menggunakan paket Render berbayar; periksa harga dan kapasitas sebelum membuat layanan. Jika kebutuhan unggahan tumbuh atau ingin menghindari disk di hosting, pindahkan penyimpanan ke S3/Cloudinary melalui `server/src/services/storage.js`.

### Siapkan MongoDB Atlas

1. Buat cluster Atlas di region terdekat (misalnya Singapore).
2. Buat database user khusus aplikasi dengan hak akses hanya ke database aplikasi; gunakan kata sandi kuat.
3. Di **Network Access**, izinkan koneksi Render. Karena alamat egress Render dapat berubah, `0.0.0.0/0` mungkin diperlukan. Batasi akses melalui kredensial database yang kuat, atau gunakan static outbound IP Render bila tersedia dan masukkan IP tersebut sebagai allowlist.
4. Salin connection string Atlas, pilih database `pouk_immanuel`, dan URL-encode karakter khusus dalam username/kata sandi. Contoh bentuk: `mongodb+srv://USER:PASSWORD@CLUSTER/pouk_immanuel?retryWrites=true&w=majority`.

### Deploy ke Render

1. Push repository ke GitHub, lalu di Render pilih **New → Blueprint** dan hubungkan repository tersebut.
2. Render membaca `render.yaml` di root. Isi `MONGODB_URI` saat diminta; `JWT_ACCESS_SECRET` dibuat otomatis. Jangan salin isi `.env` lokal ke GitHub atau ke aplikasi mobile.
3. Setelah deploy selesai, uji `https://<nama-layanan>.onrender.com/api/health`; respons yang diharapkan: `{"ok":true}`. Gambar disimpan pada disk terpasang di `/var/data/uploads` dan tetap ada setelah deploy ulang.
4. Dari **Shell** layanan Render, buat akun pengelola pertama:

   ```bash
   npm run create-admin -- --email sekretariat@contoh.org --name "Nama Lengkap" --role sekretariat
   ```

   Berikan kata sandi sementara yang dicetak skrip secara langsung kepada pemilik akun.
5. Simpan URL API HTTPS tersebut sebagai `EXPO_PUBLIC_API_URL` pada environment build **production** EAS, kemudian build aplikasi mobile sesuai bagian 5. URL ini bukan rahasia. CORS tidak perlu diubah untuk klien mobile native; bila nanti menggunakan klien web, isi `CORS_ORIGINS` di Render dengan origin web yang tepat.

Cadangkan database Atlas dan file pada disk Render secara terpisah. Disk 1 GB dapat ditingkatkan, tetapi pastikan kapasitas unggahan sesuai kebutuhan.

## 5. Build Android & iOS (EAS)

```bash
cd mobile
npx eas-cli@latest login
npx eas-cli@latest build:configure          # membuat eas.json & projectId
```

Set URL API produksi untuk build, misalnya di `eas.json` → `build.production.env.EXPO_PUBLIC_API_URL = "https://api.domain-gereja.org"`.

- **Android:** `npx eas-cli@latest build -p android --profile production` menghasilkan `.aab` untuk Google Play. Untuk APK uji coba, gunakan profil dengan `"android": { "buildType": "apk" }`.
- **iOS:** `npx eas-cli@latest build -p ios --profile production` (butuh Apple Developer Program). Kirim ke App Store dengan `npx eas-cli@latest submit -p ios`.

`bundleIdentifier`/`package` di `app.json` saat ini adalah `org.poukimmanuel.kopassus`. **Ganti sebelum build pertama**, karena nilai ini tidak bisa diubah setelah aplikasi terbit.

## 6. Keamanan, ringkas

- Semua izin diperiksa di server; tombol yang disembunyikan di aplikasi hanya untuk kenyamanan.
- Sandi di-hash dengan bcrypt (cost 12). Respons API tidak pernah berisi hash sandi.
- Access token 15 menit disimpan di memori; refresh token disimpan di Keychain/Keystore (SecureStore) dan hanya hash-nya yang disimpan di server. Token dirotasi setiap dipakai, dan logout/nonaktif/reset sandi mencabutnya.
- Rate limit: 300 req/menit/IP umum, 10 login/15 menit/IP. Akun dikunci 15 menit setelah 5 sandi salah.
- Batas 15 akun aktif ditegakkan oleh indeks unik MongoDB (kursi 1–15), sehingga aman terhadap permintaan bersamaan.
- Helmet, CORS tertutup secara default, body JSON maks. 100 KB, validasi Zod di setiap endpoint tulis, dan field asing dibuang.
- Tidak ada rahasia di aplikasi mobile; hanya `EXPO_PUBLIC_API_URL`.
