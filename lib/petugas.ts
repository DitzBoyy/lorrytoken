/** Tipe data halaman petugas (dipakai klien dan server). */
import type { StatusAntrian, StatusPemesanan } from "./pemesanan";

export type StatusDock = "tersedia" | "digunakan" | "nonaktif";

export type HasilCari = {
  id_pemesanan: number;
  kode_booking: string;
  status_pemesanan: StatusPemesanan;
  tanggal: string;
  jam_mulai: string;
  jam_selesai: string;
  nama_sopir: string;
  no_hp: string | null;
  no_polisi: string;
  jenis_truk: string | null;
  kapasitas_muatan: number | null;
  foto_truk: string | null;
  nomor_antrian: string | null;
  status_antrian: StatusAntrian | null;
  waktu_kedatangan: string | null;
  /** Tanggal slot sama dengan hari ini */
  hari_ini: boolean;
  /** Tanggal slot sudah lewat */
  sudah_lewat: boolean;
};

export type DockMonitor = {
  id_dock: number;
  nama_dock: string;
  status_dock: StatusDock;
  keterangan: string | null;
  id_antrian: number | null;
  nomor_antrian: string | null;
  waktu_mulai: string | null;
  no_polisi: string | null;
  nama_sopir: string | null;
};

export type AntrianMenunggu = {
  id_antrian: number;
  nomor_antrian: string;
  waktu_kedatangan: string;
  no_polisi: string;
  nama_sopir: string;
  tanggal: string;
  jam_mulai: string;
  jam_selesai: string;
  /** Estimasi mulai dihitung ulang setiap kali data diambil */
  estimasi: string | null;
};

export type Monitoring = {
  dock: DockMonitor[];
  menunggu: AntrianMenunggu[];
  selesaiHariIni: number;
  diperbarui: string;
};

export type Dock = {
  id_dock: number;
  nama_dock: string;
  status_dock: StatusDock;
  keterangan: string | null;
};
