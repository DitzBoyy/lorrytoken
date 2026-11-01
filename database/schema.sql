-- Skema database Loory Token: sistem antrian truk muatan
-- Struktur tabel mengikuti spesifikasi file pada BAB IV dokumen penelitian.

DROP DATABASE IF EXISTS db_antrian_truk;
CREATE DATABASE db_antrian_truk CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE db_antrian_truk;

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
