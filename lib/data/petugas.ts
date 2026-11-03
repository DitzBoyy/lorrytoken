import "server-only";
import type { Pool, PoolConnection, RowDataPacket } from "mysql2/promise";
import { db } from "@/lib/db";
import { parseWaktu } from "@/lib/format";
import type { AntrianMenunggu, Dock, DockMonitor, HasilCari, Monitoring } from "@/lib/petugas";
import { normalizePlate } from "@/lib/validation";
import { getJumlahDockAktif, getRataDurasiMenit, hitungEstimasi, toDateTimeString } from "./antrian";

type Executor = Pool | PoolConnection;

const CARI_SELECT = `
  SELECT p.id_pemesanan, p.kode_booking, p.status_pemesanan,
         DATE_FORMAT(s.tanggal, '%Y-%m-%d') AS tanggal, s.jam_mulai, s.jam_selesai,
         u.nama AS nama_sopir, u.no_hp,
         t.no_polisi, t.jenis_truk, t.kapasitas_muatan, t.foto_truk,
         a.nomor_antrian, a.status_antrian, a.waktu_kedatangan,
         (s.tanggal = CURDATE()) AS hari_ini, (s.tanggal < CURDATE()) AS sudah_lewat
  FROM pemesanan p
  JOIN slot_waktu s ON s.id_slot = p.id_slot
  JOIN pengguna u ON u.id_pengguna = p.id_pengguna
  JOIN truk t ON t.id_truk = p.id_truk
  LEFT JOIN antrian a ON a.id_pemesanan = p.id_pemesanan`;

function toHasil(row: RowDataPacket): HasilCari {
  return { ...(row as HasilCari), hari_ini: Boolean(Number(row.hari_ini)), sudah_lewat: Boolean(Number(row.sudah_lewat)) };
}

/**
 * Mencari pemesanan dengan kode pemesanan atau nomor plat.
 * Untuk nomor plat, yang diutamakan adalah pemesanan "dipesan" hari ini, lalu pemesanan terbaru truk itu.
 */
export async function cariPemesanan(q: string): Promise<HasilCari | null> {
  const input = q.trim().toUpperCase();
  if (!input) return null;

  if (input.startsWith("BK-")) {
    const [rows] = await db.execute<RowDataPacket[]>(`${CARI_SELECT} WHERE p.kode_booking = ? LIMIT 1`, [input]);
    return rows[0] ? toHasil(rows[0]) : null;
  }

  const plat = normalizePlate(input);
  if (!plat) return null;
  const [rows] = await db.execute<RowDataPacket[]>(
    `${CARI_SELECT} WHERE t.no_polisi = ?
     ORDER BY (s.tanggal = CURDATE() AND p.status_pemesanan = 'dipesan') DESC,
              (s.tanggal = CURDATE()) DESC, s.tanggal DESC, s.jam_mulai DESC LIMIT 1`,
    [plat],
  );
  return rows[0] ? toHasil(rows[0]) : null;
}

/** Nomor antrian berikutnya untuk hari ini: A-001, A-002, dan seterusnya (direset setiap hari). */
export async function nomorAntrianBerikutnya(conn: Executor = db): Promise<string> {
  const [rows] = await conn.query<RowDataPacket[]>(
    `SELECT COALESCE(MAX(CAST(SUBSTRING(nomor_antrian, 3) AS UNSIGNED)), 0) AS terakhir
     FROM antrian WHERE DATE(waktu_kedatangan) = CURDATE()`,
  );
  const urut = Number(rows[0]?.terakhir ?? 0) + 1;
  return `A-${String(urut).padStart(3, "0")}`;
}

/** Data halaman Monitoring Antrian: kartu dock dan daftar antrian menunggu dengan estimasi. */
export async function getMonitoring(): Promise<Monitoring> {
  const [dockRows] = await db.query<RowDataPacket[]>(
    `SELECT d.id_dock, d.nama_dock, d.status_dock, d.keterangan,
            a.id_antrian, a.nomor_antrian, a.waktu_mulai, t.no_polisi, u.nama AS nama_sopir
     FROM loading_dock d
     LEFT JOIN antrian a ON a.id_dock = d.id_dock AND a.status_antrian = 'dimuat'
     LEFT JOIN pemesanan p ON p.id_pemesanan = a.id_pemesanan
     LEFT JOIN truk t ON t.id_truk = p.id_truk
     LEFT JOIN pengguna u ON u.id_pengguna = p.id_pengguna
     ORDER BY d.id_dock`,
  );

  const [waitRows] = await db.query<RowDataPacket[]>(
    `SELECT a.id_antrian, a.nomor_antrian, a.waktu_kedatangan, t.no_polisi, u.nama AS nama_sopir,
            DATE_FORMAT(s.tanggal, '%Y-%m-%d') AS tanggal, s.jam_mulai, s.jam_selesai
     FROM antrian a
     JOIN pemesanan p ON p.id_pemesanan = a.id_pemesanan
     JOIN slot_waktu s ON s.id_slot = p.id_slot
     JOIN truk t ON t.id_truk = p.id_truk
     JOIN pengguna u ON u.id_pengguna = p.id_pengguna
     WHERE a.status_antrian = 'menunggu'
     ORDER BY a.waktu_kedatangan, a.id_antrian`,
  );

  const [selesai] = await db.query<RowDataPacket[]>(
    "SELECT COUNT(*) AS jumlah FROM antrian WHERE status_antrian = 'selesai' AND DATE(waktu_selesai) = CURDATE()",
  );

  const [dockAktif, rataDurasiMenit] = await Promise.all([getJumlahDockAktif(), getRataDurasiMenit()]);
  const sekarang = new Date();

  // Truk ke-i dalam antrian punya i truk menunggu di depannya.
  const menunggu: AntrianMenunggu[] = waitRows.map((row, index) => {
    const waktu = hitungEstimasi({
      sekarang,
      mulaiSlot: parseWaktu(`${row.tanggal} ${row.jam_mulai}`),
      trukDiDepan: index,
      dockAktif,
      rataDurasiMenit,
    });
    return { ...(row as AntrianMenunggu), estimasi: waktu ? toDateTimeString(waktu) : null };
  });

  return {
    dock: dockRows.map((row) => ({ ...(row as DockMonitor) })),
    menunggu,
    selesaiHariIni: Number(selesai[0]?.jumlah ?? 0),
    diperbarui: toDateTimeString(sekarang),
  };
}

export async function getDaftarDock(): Promise<Dock[]> {
  const [rows] = await db.query<(RowDataPacket & Dock)[]>(
    "SELECT id_dock, nama_dock, status_dock, keterangan FROM loading_dock ORDER BY id_dock",
  );
  return rows.map((row) => ({ ...row }));
}
