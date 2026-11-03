# Loory Token System

Aplikasi web antrian truk muatan untuk PT. SASL And Sons Indonesia. Sopir memesan slot waktu, petugas gudang memverifikasi kedatangan dan mengatur loading dock, dan manajemen memantau antrian serta mencetak laporan.

Prototipe penelitian (skripsi). Struktur database, halaman, dan alur mengikuti rancangan BAB IV.

## Teknologi

- Next.js 16 (App Router, TypeScript) dan Tailwind CSS 4
- MySQL dari XAMPP, diakses dengan `mysql2` (query SQL biasa, tanpa ORM)
- Autentikasi sendiri: `bcryptjs` untuk kata sandi, JWT (`jose`) di cookie `httpOnly`
- Pembaruan otomatis dengan polling setiap 5 detik (Monitoring Antrian, Status Antrian, Dashboard Antrian)

## Kebutuhan

- Node.js 20.9 atau lebih baru
- XAMPP dengan MySQL berjalan di port 3306

## Menjalankan pertama kali

1. Nyalakan **MySQL** dari XAMPP Control Panel.
2. Pasang dependensi:
   ```
   npm install
   ```
3. Salin `.env.example` menjadi `.env.local`, lalu isi `JWT_SECRET` dengan teks acak yang panjang:
   ```
   copy .env.example .env.local
   ```
4. Buat database beserta data awal:
   ```
   npm run db:setup
   ```
5. Jalankan aplikasi:
   ```
   npm run dev
   ```
   Buka http://localhost:3000. Halaman `/` mengarah ke halaman login.

## Akun seed

| Role | Email | Kata sandi | Keterangan |
|---|---|---|---|
| Manajemen | manajemen@loory.test | manajemen123 | |
| Petugas | petugas@loory.test | petugas123 | |
| Sopir | sopir1@loory.test | sopir123 | Truk B 9123 KXT |
| Sopir | sopir2@loory.test | sopir123 | Truk B 9478 UYZ |

Sopir baru bisa mendaftar sendiri di `/registrasi`. Akun petugas baru dibuat oleh manajemen di menu Data Pengguna.

Seed juga membuat Dock 1 sampai Dock 4 dan slot waktu hari ini sampai tiga hari ke depan, pukul 07.00 sampai 16.00. Setiap slot berdurasi satu jam dengan kuota 4. Slot 12.00–13.00 nonaktif untuk istirahat.

## Perintah

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Server pengembangan di http://localhost:3000 |
| `npm run build` | Build production |
| `npm start` | Menjalankan hasil build (production). Port lain: `npm start -- -p 3100` |
| `npm run lint` | Pemeriksaan ESLint |
| `npm run db:setup` | **Menghapus dan membuat ulang** database `db_antrian_truk`, lalu mengisi data seed. Semua data lama hilang. |
| `npm run db:slot` | Menambah slot waktu hari ini sampai tiga hari ke depan tanpa mengubah data lain. Jalankan di hari lain bila slot sudah habis. |
| `npm run db:contoh` | Mengisi data contoh untuk Dashboard dan Laporan: 8 sopir contoh, antrian selesai 7 hari terakhir dan hari ini, serta beberapa pemesanan tidak hadir. Data lain tidak diubah. |
| `npm run db:contoh -- --hapus` | Menghapus semua data contoh (akun `@contoh.loory.test` beserta pemesanan dan antriannya). |

## Halaman

| Route | Role | Halaman |
|---|---|---|
| `/login` | semua | Login |
| `/registrasi` | publik | Registrasi sopir dan truk pertama |
| `/sopir/pemesanan` | sopir | Pemesanan Slot Waktu |
| `/sopir/status` | sopir | Status Antrian (tiket nomor antrian, alur status, batal) |
| `/sopir/truk` | sopir | Data Truk |
| `/sopir/riwayat` | sopir | Riwayat Pemesanan |
| `/petugas/monitoring` | petugas | Monitoring Antrian dan loading dock |
| `/petugas/verifikasi` | petugas | Verifikasi Kedatangan (check-in, tidak hadir) |
| `/petugas/kelola` | petugas | Slot Waktu & Loading Dock |
| `/manajemen/dashboard` | manajemen | Dashboard Antrian |
| `/manajemen/laporan` | manajemen | Laporan Antrian dan cetak |
| `/manajemen/pengguna` | manajemen | Data Pengguna (akun petugas) |

Membuka halaman milik role lain akan mengarahkan pengguna kembali ke halaman awal role-nya.

## Konfigurasi `.env.local`

| Variabel | Contoh | Keterangan |
|---|---|---|
| `DB_HOST` | `localhost` | Host MySQL |
| `DB_PORT` | `3306` | Port MySQL |
| `DB_USER` | `root` | User MySQL (XAMPP: `root`) |
| `DB_PASSWORD` | | Kosong secara bawaan di XAMPP |
| `DB_NAME` | `db_antrian_truk` | Nama database |
| `JWT_SECRET` | | Teks acak panjang untuk menandatangani sesi. Wajib diisi. |
| `COOKIE_SECURE` | `true` | Opsional. Isi `true` hanya bila aplikasi dibuka lewat HTTPS. |

## Struktur folder

```
app/            halaman dan API route (app/api: auth, truk, slot, pemesanan, antrian, dock, pengguna, laporan)
components/     komponen UI dan layout
lib/            koneksi database, autentikasi, validasi, query data
database/       schema.sql, seed.sql, slot.sql
scripts/        skrip db:setup, db:slot, db:contoh
public/uploads/truk/   foto truk yang diunggah (tidak ikut repository)
proxy.ts        pemeriksaan hak akses sebelum request diproses
```

## Memindahkan ke komputer lain

1. Pasang Node.js dan XAMPP, lalu nyalakan MySQL.
2. Salin folder proyek **tanpa** `node_modules` dan `.next`, lalu jalankan `npm install`.
3. `.env.local` tidak ikut repository. Buat ulang dari `.env.example` dan isi `JWT_SECRET`. Bila `JWT_SECRET` berbeda, pengguna cukup login ulang.
4. Untuk database kosong, jalankan `npm run db:setup`. Untuk membawa data lama, ekspor `db_antrian_truk` dari phpMyAdmin lalu impor di komputer baru.
5. Foto truk ada di `public/uploads/truk/` dan tidak ikut repository. Salin folder ini bersama ekspor database, karena database hanya menyimpan path fotonya.
6. Slot waktu seed hanya untuk empat hari. Jalankan `npm run db:slot` atau tambah slot di halaman Slot Waktu & Loading Dock.
7. Untuk pemakaian sehari-hari jalankan `npm run build` lalu `npm start`. Bila dibuka dari komputer lain di jaringan, gunakan alamat IP komputer server, misalnya `http://192.168.1.10:3000`.
