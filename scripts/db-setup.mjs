// Menjalankan database/schema.sql lalu database/seed.sql ke MySQL (XAMPP).
// Pemakaian: npm run db:setup
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import mysql from "mysql2/promise";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
config({ path: path.join(root, ".env.local"), quiet: true });

const connectionConfig = {
  host: process.env.DB_HOST ?? "localhost",
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER ?? "root",
  password: process.env.DB_PASSWORD ?? "",
  multipleStatements: true,
};

async function runFile(conn, file) {
  const sql = await readFile(path.join(root, "database", file), "utf8");
  await conn.query(sql);
  console.log(`Selesai: database/${file}`);
}

let conn;
try {
  conn = await mysql.createConnection(connectionConfig);
} catch (err) {
  console.error(
    `Tidak bisa terhubung ke MySQL di ${connectionConfig.host}:${connectionConfig.port}.`,
  );
  console.error("Nyalakan MySQL dari XAMPP Control Panel, lalu jalankan ulang perintah ini.");
  console.error(`Detail: ${err.code ?? err.message}`);
  process.exit(1);
}

try {
  await runFile(conn, "schema.sql");
  await runFile(conn, "seed.sql");

  const [rows] = await conn.query(`
    SELECT 'pengguna' AS tabel, COUNT(*) AS jumlah FROM db_antrian_truk.pengguna
    UNION ALL SELECT 'truk', COUNT(*) FROM db_antrian_truk.truk
    UNION ALL SELECT 'loading_dock', COUNT(*) FROM db_antrian_truk.loading_dock
    UNION ALL SELECT 'slot_waktu', COUNT(*) FROM db_antrian_truk.slot_waktu
  `);
  console.table(rows);
  console.log("Database db_antrian_truk siap dipakai.");
} catch (err) {
  console.error("Gagal menjalankan skrip SQL:", err.message);
  process.exitCode = 1;
} finally {
  await conn.end();
}
