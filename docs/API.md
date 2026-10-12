# Dokumentasi REST API

Base URL: `http://localhost:4000` (development). Semua respons berformat JSON.

**Format error** (semua endpoint):

```json
{ "error": { "message": "Pesan yang bisa ditampilkan ke pengguna", "details": [{ "field": "title", "message": "..." }] } }
```

| Kode | Arti |
|---|---|
| 400 | Data tidak valid (lihat `details`) |
| 401 | Belum login / token kedaluwarsa / akun nonaktif |
| 403 | Login, tetapi tidak punya izin (atau masih memakai sandi sementara) |
| 404 | Data tidak ditemukan (termasuk konten draft di endpoint publik) |
| 409 | Konflik, mis. email sudah terdaftar atau batas 15 akun tercapai |
| 429 | Terlalu banyak percobaan (rate limit / akun terkunci 15 menit) |

**Pagination** (endpoint daftar): `?page=1&limit=20` (maks. 50). Respons:
`{ items, page, limit, total, hasMore }`.

---

## Publik — tanpa login

Hanya mengembalikan konten berstatus `published`. Field internal (`createdBy`, `updatedBy`) disembunyikan.

| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/api/health` | Cek server hidup |
| GET | `/api/public/church-profile` | Profil gereja (satu dokumen) |
| GET | `/api/public/church-history` | `{ intro, items[] }` urut `order` |
| GET | `/api/public/commissions` | Daftar komisi (paged) |
| GET | `/api/public/commissions/:idAtauSlug` | Detail komisi |
| GET | `/api/public/events?when=upcoming\|past\|all&q=` | Daftar acara (paged). `upcoming`: belum selesai, urut terdekat. `past`: selesai, urut terbaru. `q`: cari judul/lokasi |
| GET | `/api/public/events/:idAtauSlug` | Detail acara |
| GET | `/api/public/faqs` | `{ items[] }` semua FAQ (maks. 500), urut kategori lalu `order` |

## Autentikasi

Tidak ada endpoint registrasi. Akun dibuat lewat `npm run create-admin` atau oleh super admin.

| Method | Endpoint | Body | Keterangan |
|---|---|---|---|
| POST | `/api/auth/login` | `{ email, password }` | → `{ accessToken, refreshToken, user }`. 10 percobaan/15 menit per IP; akun dikunci 15 menit setelah 5 sandi salah |
| POST | `/api/auth/refresh` | `{ refreshToken }` | Rotasi: token lama langsung tidak berlaku → pasangan token baru |
| POST | `/api/auth/logout` | `{ refreshToken }` | 204, mencabut sesi tersebut |
| GET | `/api/auth/me` | – | Bearer. → `{ user }` beserta `permissions` |
| POST | `/api/auth/change-password` | `{ currentPassword, newPassword }` | Bearer. Sandi baru min. 10 karakter, huruf + angka. Semua sesi lain dicabut |

`user` tidak pernah berisi `passwordHash`. Access token berlaku 15 menit; refresh token 30 hari.

## Admin — header `Authorization: Bearer <accessToken>`

Akun dengan `mustChangePassword: true` mendapat 403 di semua endpoint admin sampai mengganti sandi.

| Method | Endpoint | Izin | Keterangan |
|---|---|---|---|
| GET | `/api/admin/dashboard` | `content:read` | Jumlah konten, 5 acara mendatang, 8 konten terakhir diubah |
| GET | `/api/admin/church-profile` | `content:read` | |
| PUT | `/api/admin/church-profile` | `profile:edit` | Field parsial; `socials` digabung per field |
| POST | `/api/admin/uploads` | `upload` | `multipart/form-data`, field `image`, JPG/PNG/WebP ≤ 3 MB → `{ url }` |
| GET | `/api/admin/audit-logs?entity=` | `audit:read` | Paged, terbaru dulu |
| GET | `/api/admin/users` | `users:manage` | `{ items, activeCount, maxAccounts }` |
| POST | `/api/admin/users` | `users:manage` | `{ name, email, role }` → `{ user, tempPassword }` (ditampilkan sekali) |
| PATCH | `/api/admin/users/:id` | `users:manage` | `{ name?, role?, isActive? }`. Nonaktif → kursi dilepas & sesi dicabut |
| POST | `/api/admin/users/:id/reset-password` | `users:manage` | → `{ tempPassword }`, semua sesi dicabut |
| POST | `/api/admin/users/:id/revoke-sessions` | `users:manage` | 204 |

### Konten: `:resource` = `church-history` · `commissions` · `events` · `faqs`

| Method | Endpoint | Izin | Keterangan |
|---|---|---|---|
| GET | `/api/admin/:resource?status=draft\|published&q=` | `content:read` | Paged, termasuk draft |
| GET | `/api/admin/:resource/:id` | `content:read` | |
| POST | `/api/admin/:resource` | `content:edit` (+ `content:publish` bila `status: published`) | Default `draft` |
| PUT | `/api/admin/:resource/:id` | `content:edit` (+ `content:publish` bila konten sudah/akan tayang) | |
| PATCH | `/api/admin/:resource/:id/status` | `content:publish` | `{ status }` |
| DELETE | `/api/admin/:resource/:id` | `content:delete` | 204 |

Field per jenis konten:

- **church-history**: `year`*, `title`*, `description`, `imageUrl`, `order`, `status`
- **commissions**: `name`*, `description`, `activities`, `schedule`, `contact`, `imageUrl`, `order`, `status` (slug dibuat otomatis)
- **events**: `title`*, `startAt`* (ISO 8601), `endAt` (≥ startAt, boleh `null`), `location`, `description`, `contact`, `imageUrl`, `status` (slug otomatis)
- **faqs**: `question`*, `answer`*, `category`, `order`, `status`

`imageUrl` harus kosong, diawali `/uploads/`, atau URL `http(s)://`. Field yang tidak dikenal dibuang.

Setiap create/update/status/delete, login (berhasil/gagal), penguncian akun, reset sandi, dan unggahan dicatat di audit log beserta field yang berubah.
