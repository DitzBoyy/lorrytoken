/** Tipe data halaman manajemen (dipakai klien dan server). */
import type { StatusAntrian } from "./pemesanan";
import type { StatusDock } from "./petugas";

export type SlotHariIni = {
  id_slot: number;
  jam_mulai: string;
  jam_selesai: string;
  kuota: number;
  jumlah: number;
};

export type DockDashboard = {
  id_dock: number;
  nama_dock: string;
  status_dock: StatusDock;
  no_polisi: string | null;
};

export type Dashboard = {
  /** Pemesanan untuk slot hari ini yang tidak dibatalkan */
  terdaftar: number;
  menunggu: number;
  dimuat: number;
  /** Antrian selesai hari ini */
  selesai: number;
  /** Rata-rata menit hari ini, null bila belum ada data */
  rataTunggu: number | null;
  rataPelayanan: number | null;
  perSlot: SlotHariIni[];
  dock: DockDashboard[];
  diperbarui: string;
};

export type BarisLaporan = {
  id_antrian: number;
  tanggal: string;
  nomor_antrian: string;
  no_polisi: string;
  nama_sopir: string;
  status_antrian: StatusAntrian;
  waktu_kedatangan: string;
  waktu_mulai: string | null;
  waktu_selesai: string | null;
  /** Menit, dihitung saat query (tidak disimpan) */
  waktu_tunggu: number | null;
  waktu_pelayanan: number | null;
};

export type Laporan = {
  awal: string;
  akhir: string;
  terlayani: number;
  rataTunggu: number | null;
  rataPelayanan: number | null;
  tidakHadir: number;
  baris: BarisLaporan[];
};

export type Petugas = {
  id_pengguna: number;
  nama: string;
  email: string;
  no_hp: string | null;
  /** Jumlah check-in yang dicatat akun ini */
  jumlah_checkin: number;
};
