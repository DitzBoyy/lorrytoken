import "server-only";
import type { Pool, PoolConnection, RowDataPacket } from "mysql2/promise";
import { db } from "@/lib/db";
import { parseWaktu } from "@/lib/format";

/** Rata-rata durasi pelayanan awal bila belum ada antrian selesai dalam 7 hari terakhir. */
export const DURASI_AWAL_MENIT = 40;

type Executor = Pool | PoolConnection;

/** Rata-rata (waktu_selesai - waktu_mulai) dari antrian selesai 7 hari terakhir, dalam menit. */
export async function getRataDurasiMenit(conn: Executor = db): Promise<number> {
  const [rows] = await conn.query<RowDataPacket[]>(
    `SELECT AVG(TIMESTAMPDIFF(SECOND, waktu_mulai, waktu_selesai)) / 60 AS rata
     FROM antrian
     WHERE status_antrian = 'selesai' AND waktu_mulai IS NOT NULL AND waktu_selesai IS NOT NULL
       AND waktu_selesai >= NOW() - INTERVAL 7 DAY`,
  );
  const rata = rows[0]?.rata == null ? null : Number(rows[0].rata);
  return rata && rata > 0 ? rata : DURASI_AWAL_MENIT;
}

/** Jumlah loading dock yang statusnya bukan nonaktif. */
export async function getJumlahDockAktif(conn: Executor = db): Promise<number> {
  const [rows] = await conn.query<RowDataPacket[]>(
    "SELECT COUNT(*) AS jumlah FROM loading_dock WHERE status_dock <> 'nonaktif'",
  );
  return Number(rows[0]?.jumlah ?? 0);
}

/**
 * Estimasi waktu mulai pelayanan (CLAUDE.md bagian 6):
 * max(sekarang, jam mulai slot) + floor(truk menunggu di depan / dock tidak nonaktif) x rata-rata durasi.
 * Mengembalikan null bila semua dock nonaktif (tidak bisa diperkirakan).
 */
export function hitungEstimasi(params: {
  sekarang: Date;
  mulaiSlot: Date;
  trukDiDepan: number;
  dockAktif: number;
  rataDurasiMenit: number;
}): Date | null {
  const { sekarang, mulaiSlot, trukDiDepan, dockAktif, rataDurasiMenit } = params;
  if (dockAktif <= 0) return null;
  const dasar = Math.max(sekarang.getTime(), mulaiSlot.getTime());
  const putaran = Math.floor(trukDiDepan / dockAktif);
  return new Date(dasar + putaran * rataDurasiMenit * 60_000);
}

/** Estimasi untuk satu pemesanan, mengambil jumlah dock dan rata-rata durasi dari database. */
export async function estimasiMulai(
  tanggal: string,
  jamMulai: string,
  trukDiDepan: number,
  conn: Executor = db,
): Promise<Date | null> {
  const [dockAktif, rataDurasiMenit] = await Promise.all([getJumlahDockAktif(conn), getRataDurasiMenit(conn)]);
  return hitungEstimasi({
    sekarang: new Date(),
    mulaiSlot: parseWaktu(`${tanggal} ${jamMulai}`),
    trukDiDepan,
    dockAktif,
    rataDurasiMenit,
  });
}

/** Jumlah antrian menunggu di depan satu antrian pada hari yang sama. */
export async function hitungTrukDiDepan(idAntrian: number, conn: Executor = db): Promise<number> {
  const [rows] = await conn.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS jumlah
     FROM antrian a
     JOIN antrian ini ON ini.id_antrian = ?
     WHERE a.status_antrian = 'menunggu'
       AND DATE(a.waktu_kedatangan) = DATE(ini.waktu_kedatangan)
       AND (a.waktu_kedatangan < ini.waktu_kedatangan
            OR (a.waktu_kedatangan = ini.waktu_kedatangan AND a.id_antrian < ini.id_antrian))`,
    [idAntrian],
  );
  return Number(rows[0]?.jumlah ?? 0);
}

/** Date lokal ke "YYYY-MM-DD HH:MM:SS" untuk dikirim ke klien. */
export function toDateTimeString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(
    date.getMinutes(),
  )}:${pad(date.getSeconds())}`;
}
