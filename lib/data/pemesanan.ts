import "server-only";
import type { RowDataPacket } from "mysql2";
import { db } from "@/lib/db";
import { toIsoDate } from "@/lib/format";
import type { PemesananSopir, StatusSopir } from "@/lib/pemesanan";
import { estimasiMulai, hitungTrukDiDepan, toDateTimeString } from "./antrian";

const PEMESANAN_SELECT = `
  SELECT p.id_pemesanan, p.kode_booking, p.tgl_pesan, p.status_pemesanan,
         DATE_FORMAT(s.tanggal, '%Y-%m-%d') AS tanggal, s.jam_mulai, s.jam_selesai,
         t.no_polisi, t.jenis_truk,
         a.id_antrian, a.nomor_antrian, a.waktu_kedatangan, a.waktu_mulai, a.waktu_selesai, a.status_antrian,
         d.nama_dock
  FROM pemesanan p
  JOIN slot_waktu s ON s.id_slot = p.id_slot
  JOIN truk t ON t.id_truk = p.id_truk
  LEFT JOIN antrian a ON a.id_pemesanan = p.id_pemesanan
  LEFT JOIN loading_dock d ON d.id_dock = a.id_dock`;

/** Semua pemesanan milik sopir, terbaru di atas. */
export async function getPemesananSopir(idPengguna: number): Promise<PemesananSopir[]> {
  const [rows] = await db.execute<(RowDataPacket & PemesananSopir)[]>(
    `${PEMESANAN_SELECT} WHERE p.id_pengguna = ? ORDER BY s.tanggal DESC, s.jam_mulai DESC, p.id_pemesanan DESC`,
    [idPengguna],
  );
  return rows.map((row) => ({ ...row }));
}

const urutSlot = (a: PemesananSopir, b: PemesananSopir) =>
  a.tanggal.localeCompare(b.tanggal) || a.jam_mulai.localeCompare(b.jam_mulai);

/**
 * Data halaman Status Antrian.
 * Pemesanan utama dipilih dengan urutan: kode yang diminta, antrian yang sedang berjalan (menunggu/dimuat),
 * antrian yang selesai hari ini, lalu pemesanan "dipesan" terdekat.
 */
export async function getStatusSopir(idPengguna: number, kode?: string | null): Promise<StatusSopir> {
  const semua = await getPemesananSopir(idPengguna);
  const hariIni = toIsoDate(new Date());

  const berjalan = semua
    .filter((p) => p.status_pemesanan === "check-in" && (p.status_antrian === "menunggu" || p.status_antrian === "dimuat"))
    .sort(urutSlot);
  const selesaiHariIni = semua.filter(
    (p) => p.status_antrian === "selesai" && p.waktu_selesai?.slice(0, 10) === hariIni,
  );
  const akanDatang = semua.filter((p) => p.status_pemesanan === "dipesan" && p.tanggal >= hariIni).sort(urutSlot);

  const diminta = kode ? semua.find((p) => p.kode_booking === kode) : undefined;
  const pilihan = diminta ?? berjalan[0] ?? selesaiHariIni[0] ?? akanDatang[0] ?? null;

  const lainnya = [...berjalan, ...akanDatang]
    .filter((p) => p.id_pemesanan !== pilihan?.id_pemesanan)
    .sort(urutSlot);

  let utama: StatusSopir["utama"] = null;
  if (pilihan) {
    let trukDiDepan: number | null = null;
    let estimasi: string | null = null;
    if (pilihan.status_antrian === "menunggu" && pilihan.id_antrian) {
      trukDiDepan = await hitungTrukDiDepan(pilihan.id_antrian);
      const waktu = await estimasiMulai(pilihan.tanggal, pilihan.jam_mulai, trukDiDepan);
      estimasi = waktu ? toDateTimeString(waktu) : null;
    }
    utama = { ...pilihan, trukDiDepan, estimasi };
  }

  return { utama, lainnya, diperbarui: toDateTimeString(new Date()) };
}
