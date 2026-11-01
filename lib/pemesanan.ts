/** Tipe data pemesanan yang dikirim ke halaman sopir (dipakai klien dan server). */

export type StatusPemesanan = "dipesan" | "check-in" | "dibatalkan" | "tidak hadir";
export type StatusAntrian = "menunggu" | "dimuat" | "selesai";

export type PemesananSopir = {
  id_pemesanan: number;
  kode_booking: string;
  tgl_pesan: string;
  status_pemesanan: StatusPemesanan;
  tanggal: string;
  jam_mulai: string;
  jam_selesai: string;
  no_polisi: string;
  jenis_truk: string | null;
  id_antrian: number | null;
  nomor_antrian: string | null;
  waktu_kedatangan: string | null;
  waktu_mulai: string | null;
  waktu_selesai: string | null;
  status_antrian: StatusAntrian | null;
  nama_dock: string | null;
};

export type PemesananUtama = PemesananSopir & {
  /** Jumlah truk menunggu di depan, hanya saat status antrian menunggu */
  trukDiDepan: number | null;
  /** Estimasi mulai muat "YYYY-MM-DD HH:MM:SS", dihitung ulang setiap kali data diambil */
  estimasi: string | null;
};

export type StatusSopir = {
  utama: PemesananUtama | null;
  lainnya: PemesananSopir[];
  /** Waktu server saat data diambil */
  diperbarui: string;
};

/** Status yang ditampilkan untuk satu pemesanan: status antrian bila sudah check-in. */
export function statusTampil(p: Pick<PemesananSopir, "status_pemesanan" | "status_antrian">) {
  return p.status_pemesanan === "check-in" && p.status_antrian ? p.status_antrian : p.status_pemesanan;
}
