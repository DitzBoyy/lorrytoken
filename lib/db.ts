import "server-only";
import mysql, { type Pool, type PoolConnection, type RowDataPacket } from "mysql2/promise";

/**
 * Pool koneksi MySQL (XAMPP). Disimpan di globalThis agar hot reload saat `npm run dev`
 * tidak membuka pool baru setiap kali file berubah.
 */
const globalForDb = globalThis as unknown as { __looryPool?: Pool };

export const db: Pool =
  globalForDb.__looryPool ??
  mysql.createPool({
    host: process.env.DB_HOST ?? "localhost",
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? "root",
    password: process.env.DB_PASSWORD ?? "",
    database: process.env.DB_NAME ?? "db_antrian_truk",
    connectionLimit: 10,
    // DATE dan DATETIME dikembalikan sebagai string apa adanya agar tidak bergeser zona waktu.
    dateStrings: true,
    timezone: "local",
  });

if (process.env.NODE_ENV !== "production") globalForDb.__looryPool = db;

/** Menjalankan fungsi di dalam satu transaksi. Rollback otomatis bila terjadi error. */
export async function withTransaction<T>(fn: (conn: PoolConnection) => Promise<T>): Promise<T> {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

/**
 * Transaksi yang dijaga kunci bernama MySQL (GET_LOCK). Kunci baru dilepas setelah commit atau rollback,
 * sehingga proses lain yang menunggu kunci sudah bisa membaca data yang baru disimpan.
 */
export async function withLockedTransaction<T>(
  lockName: string,
  fn: (conn: PoolConnection) => Promise<T>,
  onBusy: () => Error,
): Promise<T> {
  const conn = await db.getConnection();
  try {
    const [rows] = await conn.query<RowDataPacket[]>("SELECT GET_LOCK(?, 10) AS ok", [lockName]);
    if (Number(rows[0]?.ok) !== 1) throw onBusy();
    try {
      await conn.beginTransaction();
      try {
        const result = await fn(conn);
        await conn.commit();
        return result;
      } catch (error) {
        await conn.rollback();
        throw error;
      }
    } finally {
      await conn.query("SELECT RELEASE_LOCK(?)", [lockName]);
    }
  } finally {
    conn.release();
  }
}

/** Kode error MySQL untuk pelanggaran UNIQUE. */
export function isDuplicateError(error: unknown): error is { code: string; sqlMessage?: string } {
  return typeof error === "object" && error !== null && (error as { code?: string }).code === "ER_DUP_ENTRY";
}

/** True bila error berasal dari koneksi ke MySQL yang gagal (misalnya XAMPP belum dinyalakan). */
export function isConnectionError(error: unknown): boolean {
  const code = (error as { code?: string } | null)?.code;
  return code === "ECONNREFUSED" || code === "ER_BAD_DB_ERROR" || code === "PROTOCOL_CONNECTION_LOST" || code === "ETIMEDOUT";
}
