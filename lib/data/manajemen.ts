import "server-only";
import type { RowDataPacket } from "mysql2/promise";
import { db } from "@/lib/db";
import type { BarisLaporan, Dashboard, DockDashboard, Laporan, Petugas, SlotHariIni } from "@/lib/manajemen";
import { toDateTimeString } from "./antrian";

const angkaAtauNull = (value: unknown) => (value == null ? null : Math.round(Number(value)));

/**
 * Data Dashboard Antrian untuk hari ini. Diambil ulang setiap 5 detik.
 * Menunggu, dimuat, dan selesai dihitung dari truk yang tiba hari ini, sehingga jumlahnya
 * tidak melebihi truk terdaftar hari ini. Tabel dock tetap menampilkan keadaan dock saat ini.
 */
export async function getDashboard(): Promise<Dashboard> {
  const [[ringkas], [slotRows], [dockRows]] = await Promise.all([
    db.query<RowDataPacket[]>(
      `SELECT
         (SELECT COUNT(*) FROM pemesanan p JOIN slot_waktu s ON s.id_slot = p.id_slot
           WHERE s.tanggal = CURDATE() AND p.status_pemesanan <> 'dibatalkan') AS terdaftar,
         (SELECT COUNT(*) FROM antrian WHERE status_antrian = 'menunggu' AND DATE(waktu_kedatangan) = CURDATE()) AS menunggu,
         (SELECT COUNT(*) FROM antrian WHERE status_antrian = 'dimuat' AND DATE(waktu_kedatangan) = CURDATE()) AS dimuat,
         (SELECT COUNT(*) FROM antrian WHERE status_antrian = 'selesai' AND DATE(waktu_kedatangan) = CURDATE()) AS selesai,
         (SELECT AVG(TIMESTAMPDIFF(SECOND, waktu_kedatangan, waktu_mulai)) / 60 FROM antrian
           WHERE waktu_mulai IS NOT NULL AND DATE(waktu_mulai) = CURDATE()) AS rata_tunggu,
         (SELECT AVG(TIMESTAMPDIFF(SECOND, waktu_mulai, waktu_selesai)) / 60 FROM antrian
           WHERE status_antrian = 'selesai' AND DATE(waktu_selesai) = CURDATE()) AS rata_pelayanan`,
    ),
    db.query<RowDataPacket[]>(
      `SELECT s.id_slot, s.jam_mulai, s.jam_selesai, s.kuota, s.status_slot,
              COUNT(p.id_pemesanan) AS jumlah
       FROM slot_waktu s
       LEFT JOIN pemesanan p ON p.id_slot = s.id_slot AND p.status_pemesanan <> 'dibatalkan'
       WHERE s.tanggal = CURDATE()
       GROUP BY s.id_slot, s.jam_mulai, s.jam_selesai, s.kuota, s.status_slot
       HAVING s.status_slot = 'aktif' OR jumlah > 0
       ORDER BY s.jam_mulai`,
    ),
    db.query<RowDataPacket[]>(
      `SELECT d.id_dock, d.nama_dock, d.status_dock, t.no_polisi
       FROM loading_dock d
       LEFT JOIN antrian a ON a.id_dock = d.id_dock AND a.status_antrian = 'dimuat'
       LEFT JOIN pemesanan p ON p.id_pemesanan = a.id_pemesanan
       LEFT JOIN truk t ON t.id_truk = p.id_truk
       ORDER BY d.id_dock`,
    ),
  ]);

  const r = ringkas[0] ?? {};
  return {
    terdaftar: Number(r.terdaftar ?? 0),
    menunggu: Number(r.menunggu ?? 0),
    dimuat: Number(r.dimuat ?? 0),
    selesai: Number(r.selesai ?? 0),
    rataTunggu: angkaAtauNull(r.rata_tunggu),
    rataPelayanan: angkaAtauNull(r.rata_pelayanan),
    perSlot: slotRows.map(
      (row): SlotHariIni => ({
        id_slot: row.id_slot,
        jam_mulai: row.jam_mulai,
        jam_selesai: row.jam_selesai,
        kuota: Number(row.kuota),
        jumlah: Number(row.jumlah),
      }),
    ),
    dock: dockRows.map((row) => ({ ...(row as DockDashboard) })),
    diperbarui: toDateTimeString(new Date()),
  };
}

/**
 * Laporan periode (CLAUDE.md bagian 6). Waktu tunggu dan waktu pelayanan dihitung saat query.
 * Periode memakai tanggal kedatangan truk. Tidak hadir memakai tanggal slot pemesanan.
 */
export async function getLaporan(awal: string, akhir: string): Promise<Laporan> {
  const [[baris], [tidakHadir]] = await Promise.all([
    db.execute<RowDataPacket[]>(
      `SELECT a.id_antrian, DATE_FORMAT(a.waktu_kedatangan, '%Y-%m-%d') AS tanggal, a.nomor_antrian,
              t.no_polisi, u.nama AS nama_sopir, a.status_antrian,
              a.waktu_kedatangan, a.waktu_mulai, a.waktu_selesai,
              ROUND(TIMESTAMPDIFF(SECOND, a.waktu_kedatangan, a.waktu_mulai) / 60) AS waktu_tunggu,
              ROUND(TIMESTAMPDIFF(SECOND, a.waktu_mulai, a.waktu_selesai) / 60) AS waktu_pelayanan
       FROM antrian a
       JOIN pemesanan p ON p.id_pemesanan = a.id_pemesanan
       JOIN truk t ON t.id_truk = p.id_truk
       JOIN pengguna u ON u.id_pengguna = p.id_pengguna
       WHERE DATE(a.waktu_kedatangan) BETWEEN ? AND ?
       ORDER BY a.waktu_kedatangan, a.id_antrian`,
      [awal, akhir],
    ),
    db.execute<RowDataPacket[]>(
      `SELECT COUNT(*) AS jumlah FROM pemesanan p JOIN slot_waktu s ON s.id_slot = p.id_slot
       WHERE p.status_pemesanan = 'tidak hadir' AND s.tanggal BETWEEN ? AND ?`,
      [awal, akhir],
    ),
  ]);

  const data: BarisLaporan[] = baris.map((row) => ({
    ...(row as BarisLaporan),
    waktu_tunggu: angkaAtauNull(row.waktu_tunggu),
    waktu_pelayanan: angkaAtauNull(row.waktu_pelayanan),
  }));

  const rata = (values: number[]) =>
    values.length === 0 ? null : Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);
  const selesai = data.filter((row) => row.status_antrian === "selesai");

  return {
    awal,
    akhir,
    terlayani: selesai.length,
    rataTunggu: rata(data.flatMap((row) => (row.waktu_tunggu == null ? [] : [row.waktu_tunggu]))),
    rataPelayanan: rata(selesai.flatMap((row) => (row.waktu_pelayanan == null ? [] : [row.waktu_pelayanan]))),
    tidakHadir: Number(tidakHadir[0]?.jumlah ?? 0),
    baris: data,
  };
}

/** Akun petugas beserta jumlah check-in yang pernah dicatat. */
export async function getDaftarPetugas(): Promise<Petugas[]> {
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT u.id_pengguna, u.nama, u.email, u.no_hp, COUNT(a.id_antrian) AS jumlah_checkin
     FROM pengguna u
     LEFT JOIN antrian a ON a.id_petugas = u.id_pengguna
     WHERE u.role = 'petugas'
     GROUP BY u.id_pengguna, u.nama, u.email, u.no_hp
     ORDER BY u.nama`,
  );
  return rows.map((row) => ({ ...(row as Petugas), jumlah_checkin: Number(row.jumlah_checkin) }));
}
