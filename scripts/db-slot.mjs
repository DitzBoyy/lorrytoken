// Menambah slot waktu hari ini dan tiga hari ke depan tanpa menghapus data lain.
// Pemakaian: npm run db:slot
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import mysql from "mysql2/promise";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
config({ path: path.join(root, ".env.local"), quiet: true });

const host = process.env.DB_HOST ?? "localhost";
const port = Number(process.env.DB_PORT ?? 3306);

let conn;
try {
  conn = await mysql.createConnection({
    host,
    port,
    user: process.env.DB_USER ?? "root",
    password: process.env.DB_PASSWORD ?? "",
    multipleStatements: true,
  });
} catch (err) {
  console.error(`Tidak bisa terhubung ke MySQL di ${host}:${port}.`);
  console.error("Nyalakan MySQL dari XAMPP Control Panel, lalu jalankan ulang perintah ini.");
  console.error(`Detail: ${err.code ?? err.message}`);
  process.exit(1);
}

try {
  const sql = await readFile(path.join(root, "database", "slot.sql"), "utf8");
  // Hasil multi-statement: [hasil USE, hasil INSERT]; yang dihitung adalah INSERT.
  const [results] = await conn.query(sql);
  const added = results.at(-1)?.affectedRows ?? 0;

  const [rows] = await conn.query(`
    SELECT DATE_FORMAT(tanggal, '%Y-%m-%d') AS tanggal,
           COUNT(*) AS jumlah_slot,
           CAST(SUM(status_slot = 'aktif') AS UNSIGNED) AS aktif
    FROM db_antrian_truk.slot_waktu
    WHERE tanggal BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 3 DAY)
    GROUP BY tanggal ORDER BY tanggal
  `);
  console.log(`${added} slot baru ditambahkan. Slot yang sudah ada tidak diubah.`);
  console.table(rows);
} catch (err) {
  if (err.code === "ER_BAD_DB_ERROR") {
    console.error("Database db_antrian_truk belum ada. Jalankan npm run db:setup terlebih dahulu.");
  } else {
    console.error("Gagal menambah slot:", err.message);
  }
  process.exitCode = 1;
} finally {
  await conn.end();
}
