# Loory Token System: Sistem Antrian Truk Muatan

Dokumen ini adalah panduan kerja untuk Claude Code. Baca seluruhnya sebelum menulis kode, dan kembali ke sini setiap kali ragu.

Loory Token System adalah aplikasi web antrian truk muatan untuk PT. SASL And Sons Indonesia. Aplikasi ini adalah prototipe untuk penelitian (skripsi), jadi rancangan di dokumen ini sudah dikunci di BAB IV. Jangan menambah, mengganti nama, atau menghapus tabel, field, halaman, atau alur tanpa bertanya ke pengguna terlebih dahulu, karena semuanya harus sama dengan dokumen penelitian.

## 1. Lingkungan

- Sistem operasi: Windows. Workspace: `D:\Web`. Folder proyek: `D:\Web\loory-token`.
- Node.js sudah terpasang. XAMPP sudah terpasang dan menyediakan MySQL (port 3306, user `root`, kata sandi kosong secara default).
- Gunakan perintah yang berjalan di PowerShell atau Command Prompt Windows. Gunakan path dengan backslash di instruksi untuk pengguna, tetapi path dengan slash di dalam kode.
- Pastikan MySQL di XAMPP sudah berjalan sebelum menjalankan migrasi atau seed. Jika koneksi gagal, minta pengguna menyalakan MySQL dari XAMPP Control Panel, jangan mencoba memasang MySQL lain.
- Mockup rujukan ada di `D:\Web\loory-token\docs\mockup` (gambar PNG dan `mockup_html.zip`). Jika folder ini belum ada, minta pengguna menyalinnya.

## 2. Teknologi

- Next.js (App Router) dengan TypeScript, versi stabil terbaru.
- MySQL dari XAMPP, diakses dengan paket `mysql2` memakai query SQL biasa dan prepared statement. Jangan memakai ORM, supaya struktur tabel tetap sama persis dengan spesifikasi file di dokumen penelitian.
- Autentikasi dibuat sendiri: kata sandi di-hash dengan `bcryptjs`, sesi disimpan sebagai JWT (paket `jose`) di cookie `httpOnly`. Pemeriksaan hak akses dilakukan di `middleware.ts` dan diulang di setiap API route.
- Styling dengan Tailwind CSS memakai design token pada bagian 7.
- Real-time memakai polling: halaman Monitoring Antrian, Status Antrian, dan Dashboard Manajemen mengambil ulang data setiap 5 detik. Jangan memakai WebSocket.
- Foto truk disimpan di `public/uploads/truk/`, dan yang disimpan di database hanya path file-nya.
- Konfigurasi koneksi di `.env.local`: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME=db_antrian_truk`, `JWT_SECRET`.

## 3. Skill yang wajib dipakai

Gunakan skill berikut sesuai tahapnya. Panggil skill-nya, baca instruksinya, lalu ikuti.

1. **Sebelum menulis komponen UI pertama:** panggil `ui-ux-pro-max:design-system` untuk menyusun design token (warna, tipografi, spacing, radius) dari bagian 7, lalu simpan hasilnya di `app/globals.css` dan konfigurasi Tailwind.
2. **Saat membangun komponen dan halaman:** panggil `ui-ux-pro-max:ui-styling` dan `design-taste-frontend`.
3. **Setelah setiap halaman selesai:** panggil `impeccable` untuk meninjau halaman tersebut, lalu perbaiki temuan yang melanggar bagian 7 dan 8.
4. **Jika butuh kemampuan yang tidak tercakup skill di atas:** panggil `find-skills` dulu sebelum membuat solusi sendiri.

Jangan memakai `ui-ux-pro-max:banner-design`, `ui-ux-pro-max:slides`, atau `ui-ux-pro-max:brand` untuk proyek ini. Identitas visual sudah ditetapkan di bagian 7. Jika saran dari skill bertentangan dengan bagian 7 atau 8, ikuti dokumen ini.

## 4. Pengguna dan hak akses

Ada tiga role, disimpan di kolom `pengguna.role`:

| Role | Cara mendapatkan akun | Halaman awal setelah login |
|---|---|---|
| `sopir` | Mendaftar sendiri di halaman Registrasi | Pemesanan Slot |
| `petugas` | Dibuatkan oleh manajemen di menu Data Pengguna | Monitoring Antrian |
| `manajemen` | Dibuat lewat seed saat instalasi | Dashboard Antrian |

- Form registrasi tidak boleh punya pilihan role. Registrasi selalu menghasilkan role `sopir`.
- Jika pengguna membuka halaman milik role lain, arahkan kembali ke halaman awal role-nya.
- Semua pengguna memakai halaman login yang sama.

## 5. Database

Nama database: `db_antrian_truk`. Buat file `database/schema.sql` dan `database/seed.sql`, lalu skrip `npm run db:setup` yang menjalankan keduanya. Struktur tabel harus persis seperti ini:

```sql
CREATE TABLE pengguna (
  id_pengguna INT(11) AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  no_hp VARCHAR(15),
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL
);

CREATE TABLE truk (
  id_truk INT(11) AUTO_INCREMENT PRIMARY KEY,
  id_pengguna INT(11) NOT NULL,
  no_polisi VARCHAR(15) NOT NULL UNIQUE,
  jenis_truk VARCHAR(50) NULL,
  kapasitas_muatan INT(11) NULL,
  foto_truk VARCHAR(255) NULL,
  FOREIGN KEY (id_pengguna) REFERENCES pengguna(id_pengguna)
);

CREATE TABLE slot_waktu (
  id_slot INT(11) AUTO_INCREMENT PRIMARY KEY,
  tanggal DATE NOT NULL,
  jam_mulai TIME NOT NULL,
  jam_selesai TIME NOT NULL,
  kuota INT(3) NOT NULL,
  status_slot VARCHAR(20) NOT NULL DEFAULT 'aktif'
);

CREATE TABLE pemesanan (
  id_pemesanan INT(11) AUTO_INCREMENT PRIMARY KEY,
  kode_booking VARCHAR(20) NOT NULL UNIQUE,
  id_pengguna INT(11) NOT NULL,
  id_truk INT(11) NOT NULL,
  id_slot INT(11) NOT NULL,
  tgl_pesan DATETIME NOT NULL,
  status_pemesanan VARCHAR(20) NOT NULL DEFAULT 'dipesan',
  FOREIGN KEY (id_pengguna) REFERENCES pengguna(id_pengguna),
  FOREIGN KEY (id_truk) REFERENCES truk(id_truk),
  FOREIGN KEY (id_slot) REFERENCES slot_waktu(id_slot)
);

CREATE TABLE loading_dock (
  id_dock INT(11) AUTO_INCREMENT PRIMARY KEY,
  nama_dock VARCHAR(50) NOT NULL,
  status_dock VARCHAR(20) NOT NULL DEFAULT 'tersedia',
  keterangan TEXT NULL
);

CREATE TABLE antrian (
  id_antrian INT(11) AUTO_INCREMENT PRIMARY KEY,
  id_pemesanan INT(11) NOT NULL UNIQUE,
  id_dock INT(11) NULL,
  id_petugas INT(11) NOT NULL,
  nomor_antrian VARCHAR(10) NOT NULL,
  waktu_kedatangan DATETIME NOT NULL,
  waktu_mulai DATETIME NULL,
  waktu_selesai DATETIME NULL,
  estimasi_waktu DATETIME NULL,
  status_antrian VARCHAR(20) NOT NULL DEFAULT 'menunggu',
  FOREIGN KEY (id_pemesanan) REFERENCES pemesanan(id_pemesanan),
  FOREIGN KEY (id_dock) REFERENCES loading_dock(id_dock),
  FOREIGN KEY (id_petugas) REFERENCES pengguna(id_pengguna)
);
```

Seed minimal: satu akun manajemen, satu akun petugas, dua akun sopir masing-masing dengan satu truk, empat loading dock (Dock 1 sampai Dock 4), dan slot waktu untuk hari ini serta tiga hari ke depan (07.00 sampai 16.00, satu jam per slot, kuota 4, slot 12.00 sampai 13.00 berstatus nonaktif untuk istirahat). Tuliskan email dan kata sandi akun seed di README.

## 6. Aturan bisnis

**Nilai status (huruf kecil di database):**
- `pemesanan.status_pemesanan`: `dipesan`, `check-in`, `dibatalkan`, `tidak hadir`
- `antrian.status_antrian`: `menunggu`, `dimuat`, `selesai`
- `loading_dock.status_dock`: `tersedia`, `digunakan`, `nonaktif`
- `slot_waktu.status_slot`: `aktif`, `nonaktif`

**Registrasi sopir:** form berisi nama, email, nomor HP, kata sandi, nomor plat truk, dan foto truk (JPG atau PNG, maksimal 2 MB). Dalam satu transaksi, sistem membuat baris `pengguna` (role `sopir`) dan baris `truk` pertama. `jenis_truk` dan `kapasitas_muatan` boleh kosong dan dilengkapi nanti di halaman Data Truk.

**Pemesanan slot:**
- Sisa kuota = `kuota` dikurangi jumlah pemesanan di slot itu yang statusnya bukan `dibatalkan`.
- Tolak pemesanan jika sisa kuota 0 atau slot nonaktif. Pemeriksaan kuota dan penyimpanan dilakukan dalam satu transaksi agar dua sopir tidak bisa mengambil kuota terakhir bersamaan.
- Format `kode_booking`: `BK-YYYYMMDD-NNNN` (tanggal slot, nomor urut 4 digit per tanggal).
- Sopir hanya bisa membatalkan pemesanan berstatus `dipesan`.

**Verifikasi kedatangan (check-in):**
- Petugas mencari dengan kode pemesanan atau nomor plat. Tampilkan foto truk agar petugas bisa mencocokkan truk yang datang.
- Check-in hanya untuk pemesanan berstatus `dipesan` yang tanggal slotnya hari ini.
- Saat check-in: `status_pemesanan` menjadi `check-in`, buat baris `antrian` dengan `waktu_kedatangan` = sekarang, `status_antrian` = `menunggu`, `nomor_antrian` berformat `A-001` (urut, direset setiap hari), dan `estimasi_waktu` dihitung.
- Petugas juga bisa menandai pemesanan sebagai `tidak hadir`.

**Estimasi waktu mulai pelayanan:** `max(sekarang, jam_mulai slot) + floor(jumlah truk menunggu di depannya / jumlah dock yang tidak nonaktif) x rata-rata durasi pelayanan`. Rata-rata durasi diambil dari antrian `selesai` 7 hari terakhir, dengan nilai awal 40 menit jika belum ada data.

**Alokasi dan pembaruan status:**
- Alokasi hanya untuk antrian `menunggu` ke dock `tersedia`. Isi `id_dock`, `waktu_mulai` = sekarang, `status_antrian` = `dimuat`, dan dock menjadi `digunakan`.
- Tombol Selesai mengisi `waktu_selesai` = sekarang, `status_antrian` = `selesai`, dan dock kembali `tersedia`.
- Jika tidak ada dock tersedia, tombol Alokasikan dinonaktifkan.

**Perhitungan laporan (tidak disimpan, dihitung saat query):**
- Waktu tunggu = `waktu_mulai - waktu_kedatangan` (menit).
- Waktu pelayanan = `waktu_selesai - waktu_mulai` (menit).
- Truk terlayani = jumlah antrian `selesai` pada periode.

## 7. Arah desain

Ikuti mockup di `docs/mockup` sebagai rujukan utama tata letak. Konsepnya diambil dari rambu gudang dan area muat: tegas, terbaca dari jauh, tidak dekoratif.

- **Warna:** ink `#1E2830` (sidebar, teks utama), steel `#42515C`, latar `#E9ECEE`, panel `#FFFFFF`, garis `#D5DADE`, aksen safety yellow `#F5B800` (hanya untuk aksi utama, menu aktif, dan garis hazard).
- **Warna status (selalu sama di semua halaman):** menunggu `#8A5E00` di atas `#FFF2C7`, dimuat `#1F5FA8` di atas `#E2ECF8`, selesai `#2C7A4B` di atas `#DFF1E5`, dipesan dan nonaktif abu-abu, error `#B3261E`.
- **Tipografi:** satu keluarga sans untuk teks (misalnya Archivo) dan versi condensed-nya untuk judul halaman, nomor antrian, dan angka besar (misalnya Archivo Narrow atau Barlow Condensed). Muat lewat `next/font`. Jangan memakai Inter atau Roboto sebagai pilihan utama.
- **Elemen khas:** garis hazard kuning-hitam diagonal di atas sidebar dan di atas kartu loading dock yang sedang dipakai, nomor plat ditampilkan sebagai kotak berbingkai seperti pelat kendaraan, dan tiket nomor antrian besar di halaman Status Antrian.
- **Tata letak:** sidebar kiri gelap dengan menu sesuai role, header putih berisi judul halaman di kiri dan nama serta role pengguna di kanan, konten berupa panel putih dengan border tipis dan radius kecil (4 sampai 6 px).
- **Bahasa antarmuka:** Bahasa Indonesia yang singkat dan langsung, huruf kapital hanya di awal kalimat.
- **Responsif:** semua halaman sopir harus nyaman dipakai di ponsel, karena sopir membuka aplikasi dari ponsel. Halaman petugas dan manajemen diutamakan untuk desktop, tetapi tidak boleh rusak di layar kecil.

## 8. Larangan desain

**Penggunaan tanda pisah:**
- Jangan memakai em dash (—), en dash sebagai pengganti koma, atau tanda `--` di teks antarmuka, label, pesan, maupun placeholder. Pecah menjadi dua kalimat atau pakai koma.
- Pengecualian: en dash boleh untuk rentang jam (contoh `08.00–09.00`). Custom property CSS seperti `--color-ink` tidak termasuk larangan ini.

**Hindari ciri desain buatan AI yang generik (AI slop):**
- Tidak ada gradien ungu, biru-ungu, atau gradien warna-warni di latar, tombol, maupun teks.
- Tidak ada glassmorphism, blur latar, glow, atau bayangan tebal berlapis.
- Tidak ada emoji sebagai ikon, dan tidak ada deretan ikon di dalam lingkaran berwarna sebagai hiasan.
- Tidak ada kartu dengan radius besar (lebih dari 8 px) dan bayangan lembut di semua elemen.
- Tidak ada hero section, slogan pemasaran, atau kalimat seperti "Seamless", "Effortless", "Unlock", "Revolusioner", "Solusi terbaik untuk Anda".
- Tidak ada angka statistik palsu, testimoni palsu, atau teks lorem ipsum. Data contoh harus masuk akal untuk antrian truk.
- Tidak ada animasi tanpa fungsi (fade-in setiap elemen, efek hover berlebihan, ikon berputar). Transisi cukup untuk perubahan status dan umpan balik tombol.
- Tidak menaruh semua konten di tengah layar. Gunakan tata letak kerja dengan perataan kiri seperti di mockup.
- Tidak menambah fitur yang tidak diminta (mode gelap, notifikasi, chatbot, onboarding, halaman landing).
- Warna aksen kuning tidak dipakai di mana-mana. Jika semua hal disorot, tidak ada yang tersorot.

## 9. Halaman dan route

| Route | Role | Halaman | Mockup |
|---|---|---|---|
| `/login` | semua | Login | 01 |
| `/registrasi` | publik | Registrasi sopir dan truk pertama | 02 |
| `/sopir/truk` | sopir | Data Truk (tambah, ubah, hapus, foto) | 03 |
| `/sopir/pemesanan` | sopir | Pemesanan Slot Waktu | 04 |
| `/sopir/status` | sopir | Status Antrian (tiket, alur status, batal) | 05 |
| `/sopir/riwayat` | sopir | Riwayat Pemesanan | tidak ada, ikuti gaya tabel |
| `/petugas/verifikasi` | petugas | Verifikasi Kedatangan | 06 |
| `/petugas/monitoring` | petugas | Monitoring Antrian dan loading dock | 07 |
| `/petugas/kelola` | petugas | Kelola Slot Waktu dan Loading Dock | 08 |
| `/manajemen/dashboard` | manajemen | Dashboard Antrian | 09 |
| `/manajemen/laporan` | manajemen | Laporan dan cetak | 10 |
| `/manajemen/pengguna` | manajemen | Data Pengguna (kelola akun petugas) | tidak ada, ikuti gaya tabel |

API route berada di `app/api/` dan dikelompokkan: `auth` (login, logout, registrasi), `truk`, `slot`, `pemesanan`, `antrian`, `dock`, `pengguna`, `laporan`. Setiap API route memeriksa role sebelum memproses data.

Halaman cetak laporan memakai stylesheet `@media print` yang menyembunyikan sidebar dan tombol.

## 10. Urutan pengerjaan

1. Scaffold proyek Next.js di `D:\Web\loory-token`, pasang dependensi, buat `.env.local`.
2. Buat `schema.sql`, `seed.sql`, dan `npm run db:setup`. Jalankan dan pastikan berhasil.
3. Jalankan skill design-system (bagian 3), lalu buat layout dasar: sidebar per role, header, dan komponen dasar (tombol, input, tabel, tag status, pelat nomor).
4. Autentikasi: login, registrasi, logout, middleware role.
5. Halaman sopir, lalu petugas, lalu manajemen, sesuai urutan tabel bagian 9. Tinjau setiap halaman dengan `impeccable` setelah selesai.
6. Uji semua skenario di bagian 11 secara manual di browser, lalu laporkan hasilnya ke pengguna.
7. Tulis `README.md` berisi cara menjalankan proyek, akun seed, dan perintah yang tersedia.

Kerjakan bertahap. Setelah setiap langkah besar, jalankan `npm run build` atau `npm run dev`, perbaiki error, lalu ringkas apa yang selesai kepada pengguna sebelum lanjut.

## 11. Skenario yang harus lolos (black box testing di BAB IV)

**Login**
1. Email dan kata sandi kosong: ditolak dengan pesan wajib diisi.
2. Kata sandi salah: ditolak dengan pesan login gagal.
3. Data benar: masuk ke halaman awal sesuai role.
4. Sopir membuka `/petugas/monitoring`: diarahkan kembali ke halaman sopir.

**Pemesanan slot**
1. Slot dengan sisa kuota: tersimpan dan kode pemesanan tampil.
2. Slot penuh: ditolak dengan pesan slot penuh.
3. Tanpa memilih truk: ditolak dengan pesan truk wajib dipilih.
4. Membatalkan pemesanan `dipesan`: status menjadi `dibatalkan` dan kuota kembali.

**Verifikasi kedatangan**
1. Kode valid: data pemesanan dan foto truk tampil.
2. Kode tidak terdaftar: pesan data tidak ditemukan.
3. Check-in: nomor antrian terbentuk, waktu kedatangan tercatat, status `menunggu`.

**Alokasi dan status pelayanan**
1. Alokasi ke dock tersedia: status `dimuat`, dock `digunakan`, waktu mulai tercatat.
2. Semua dock digunakan: tombol Alokasikan nonaktif.
3. Tombol Selesai: status `selesai`, waktu selesai tercatat, dock kembali `tersedia`.
4. Perubahan status terlihat di halaman sopir dan dashboard manajemen tanpa memuat ulang halaman (dalam 5 detik).

**Laporan**
1. Periode dengan data: waktu tunggu, waktu pelayanan, dan jumlah truk terlayani tampil.
2. Periode tanpa data: pesan data tidak tersedia.
3. Cetak: tampilan cetak tanpa sidebar dan tombol.

## 12. Kapan harus bertanya ke pengguna

Tanyakan dulu, jangan memutuskan sendiri, jika:
- ada kebutuhan yang tidak tercakup dokumen ini,
- perubahan akan menambah, mengganti nama, atau menghapus tabel, field, halaman, atau status,
- ada konflik antara mockup dan dokumen ini. Dokumen ini yang diikuti, tetapi laporkan konfliknya.
