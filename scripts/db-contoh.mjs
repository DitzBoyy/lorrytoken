// Mengisi data contoh untuk Dashboard Antrian dan Laporan: antrian selesai 7 hari terakhir dan hari ini,
// ditambah beberapa pemesanan tidak hadir. Data lain (akun, truk, pemesanan milik pengguna) tidak diubah.
//
// Pemakaian:
//   npm run db:contoh              mengisi data contoh
//   npm run db:contoh -- --hapus   menghapus semua data contoh (akun @contoh.loory.test beserta pemesanannya)
//
// Semua data contoh memakai akun sopir dengan email ...@contoh.loory.test sehingga mudah dikenali dan dihapus.
import path from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import { config } from "dotenv";
import mysql from "mysql2/promise";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
config({ path: path.join(root, ".env.local"), quiet: true });

const DOMAIN = "@contoh.loory.test";
const HARI_KE_BELAKANG = 7;

const SOPIR = [
  ["Andi Pratama", "B 9045 KL", "Truk engkel", 4000],
  ["Dedi Kurniawan", "B 9310 UX", "Truk tronton", 15000],
  ["Joko Susilo", "D 8811 AB", "Truk fuso", 8000],
  ["Rudi Hartono", "B 9567 KS", "Truk tronton", 15000],
  ["Agus Salim", "B 9702 UJ", "Truk engkel", 4000],
  ["Bambang Setiawan", "F 8123 QA", "Truk fuso", 8000],
  ["Hendra Saputra", "B 9188 TR", "Truk wingbox", 12000],
  ["Yusuf Maulana", "A 8834 ZB", "Truk fuso", 8000],
];

const host = process.env.DB_HOST ?? "localhost";
const port = Number(process.env.DB_PORT ?? 3306);

let conn;
try {
  conn = await mysql.createConnection({
    host,
    port,
    user: process.env.DB_USER ?? "root",
    password: process.env.DB_PASSWORD ?? "",
    database: process.env.DB_NAME ?? "db_antrian_truk",
    dateStrings: true,
  });
} catch (err) {
  if (err.code === "ER_BAD_DB_ERROR") {
    console.error("Database db_antrian_truk belum ada. Jalankan npm run db:setup terlebih dahulu.");
  } else {
    console.error(`Tidak bisa terhubung ke MySQL di ${host}:${port}.`);
    console.error("Nyalakan MySQL dari XAMPP Control Panel, lalu jalankan ulang perintah ini.");
    console.error(`Detail: ${err.code ?? err.message}`);
  }
  process.exit(1);
}

const pad = (n) => String(n).padStart(2, "0");
const isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const dateTime = (d) => `${isoDate(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
const addMin = (d, m) => new Date(d.getTime() + m * 60_000);

/** PRNG dengan seed agar data contoh sama setiap kali dibuat untuk tanggal yang sama. */
function acak(seed) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return { next, antara: (min, max) => min + Math.floor(next() * (max - min + 1)) };
}

async function hapusContoh() {
  await conn.beginTransaction();
  try {
    const [users] = await conn.query("SELECT id_pengguna FROM pengguna WHERE email LIKE ?", [`%${DOMAIN}`]);
    const ids = users.map((u) => u.id_pengguna);
    if (ids.length === 0) {
      await conn.rollback();
      console.log("Tidak ada data contoh yang perlu dihapus.");
      return;
    }
    const [a] = await conn.query(
      "DELETE a FROM antrian a JOIN pemesanan p ON p.id_pemesanan = a.id_pemesanan WHERE p.id_pengguna IN (?)",
      [ids],
    );
    const [p] = await conn.query("DELETE FROM pemesanan WHERE id_pengguna IN (?)", [ids]);
    await conn.query("DELETE FROM truk WHERE id_pengguna IN (?)", [ids]);
    await conn.query("DELETE FROM pengguna WHERE id_pengguna IN (?)", [ids]);
    await conn.commit();
    console.log(`Data contoh dihapus: ${ids.length} akun sopir, ${p.affectedRows} pemesanan, ${a.affectedRows} antrian.`);
  } catch (err) {
    await conn.rollback();
    throw err;
  }
}

async function pastikanSlot(tanggal) {
  const [rows] = await conn.query("SELECT COUNT(*) AS n FROM slot_waktu WHERE tanggal = ?", [tanggal]);
  if (Number(rows[0].n) > 0) return;
  const values = [];
  for (let jam = 7; jam < 16; jam += 1) {
    values.push([tanggal, `${pad(jam)}:00:00`, `${pad(jam + 1)}:00:00`, 4, jam === 12 ? "nonaktif" : "aktif"]);
  }
  await conn.query("INSERT INTO slot_waktu (tanggal, jam_mulai, jam_selesai, kuota, status_slot) VALUES ?", [values]);
}

async function isiContoh() {
  const [ada] = await conn.query("SELECT COUNT(*) AS n FROM pengguna WHERE email LIKE ?", [`%${DOMAIN}`]);
  if (Number(ada[0].n) > 0) {
    console.error("Data contoh sudah ada. Hapus dulu dengan: npm run db:contoh -- --hapus");
    process.exitCode = 1;
    return;
  }

  const [petugasRows] = await conn.query("SELECT id_pengguna FROM pengguna WHERE role = 'petugas' ORDER BY id_pengguna LIMIT 1");
  if (petugasRows.length === 0) {
    console.error("Belum ada akun petugas. Jalankan npm run db:setup atau buat akun petugas di Data Pengguna.");
    process.exitCode = 1;
    return;
  }
  const idPetugas = petugasRows[0].id_pengguna;

  const [dockRows] = await conn.query("SELECT id_dock FROM loading_dock WHERE status_dock <> 'nonaktif' ORDER BY id_dock");
  const [semuaDock] = await conn.query("SELECT id_dock FROM loading_dock ORDER BY id_dock");
  const dock = (dockRows.length > 0 ? dockRows : semuaDock).map((d) => d.id_dock);
  if (dock.length === 0) {
    console.error("Belum ada loading dock. Jalankan npm run db:setup terlebih dahulu.");
    process.exitCode = 1;
    return;
  }

  const [platDipakai] = await conn.query("SELECT no_polisi FROM truk WHERE no_polisi IN (?)", [SOPIR.map((s) => s[1])]);
  if (platDipakai.length > 0) {
    console.error(`Nomor plat contoh sudah dipakai truk lain: ${platDipakai.map((r) => r.no_polisi).join(", ")}.`);
    process.exitCode = 1;
    return;
  }

  const sekarang = new Date();
  const hash = await bcrypt.hash("sopir123", 10);
  const ringkasan = [];

  await conn.beginTransaction();
  try {
    const sopir = [];
    for (const [i, [nama, plat, jenis, kapasitas]] of SOPIR.entries()) {
      const email = `sopir.contoh${i + 1}${DOMAIN}`;
      const [u] = await conn.query(
        "INSERT INTO pengguna (nama, email, no_hp, password, role) VALUES (?, ?, ?, ?, 'sopir')",
        [nama, email, `08129000${pad(i + 10)}00`, hash],
      );
      const [t] = await conn.query(
        "INSERT INTO truk (id_pengguna, no_polisi, jenis_truk, kapasitas_muatan, foto_truk) VALUES (?, ?, ?, ?, NULL)",
        [u.insertId, plat, jenis, kapasitas],
      );
      sopir.push({ id_pengguna: u.insertId, id_truk: t.insertId });
    }

    for (let mundur = HARI_KE_BELAKANG; mundur >= 0; mundur -= 1) {
      const hari = new Date(sekarang.getFullYear(), sekarang.getMonth(), sekarang.getDate() - mundur);
      const tanggal = isoDate(hari);
      const rng = acak(Number(tanggal.replace(/-/g, "")));
      await pastikanSlot(tanggal);

      const [slotRows] = await conn.query(
        `SELECT s.id_slot, s.jam_mulai, s.kuota,
                (SELECT COUNT(*) FROM pemesanan p WHERE p.id_slot = s.id_slot AND p.status_pemesanan <> 'dibatalkan') AS terpakai
         FROM slot_waktu s WHERE s.tanggal = ? AND s.status_slot = 'aktif' ORDER BY s.jam_mulai`,
        [tanggal],
      );
      const [kodeRows] = await conn.query("SELECT MAX(kode_booking) AS kode FROM pemesanan WHERE kode_booking LIKE ?", [
        `BK-${tanggal.replace(/-/g, "")}-%`,
      ]);
      let urutKode = kodeRows[0].kode ? Number(kodeRows[0].kode.slice(-4)) : 0;
      const [nomorRows] = await conn.query(
        "SELECT COALESCE(MAX(CAST(SUBSTRING(nomor_antrian, 3) AS UNSIGNED)), 0) AS n FROM antrian WHERE DATE(waktu_kedatangan) = ?",
        [tanggal],
      );
      let urutAntrian = Number(nomorRows[0].n);

      const dockBebas = new Map(dock.map((id) => [id, new Date(hari.getFullYear(), hari.getMonth(), hari.getDate(), 7, 0)]));
      let selesai = 0;
      let tidakHadir = 0;

      for (const slot of slotRows) {
        const sisa = Number(slot.kuota) - Number(slot.terpakai);
        const jumlah = Math.min(sisa, rng.antara(2, 4));
        const [jam, menit] = slot.jam_mulai.split(":").map(Number);
        const mulaiSlot = new Date(hari.getFullYear(), hari.getMonth(), hari.getDate(), jam, menit);

        // Sopir berbeda di setiap slot, urutan diacak.
        const urutan = [...sopir].sort(() => rng.next() - 0.5).slice(0, jumlah);
        const kedatangan = urutan
          .map((s) => ({ ...s, tiba: addMin(mulaiSlot, rng.antara(-10, 20)) }))
          .sort((a, b) => a.tiba - b.tiba);

        for (const item of kedatangan) {
          const absen = mundur > 0 && rng.next() < 0.08;
          const idDock = [...dockBebas.entries()].sort((a, b) => a[1] - b[1])[0][0];
          const waktuMulai = new Date(Math.max(addMin(item.tiba, rng.antara(4, 26)).getTime(), dockBebas.get(idDock).getTime()));
          const waktuSelesai = addMin(waktuMulai, rng.antara(28, 50));
          // Hari ini hanya antrian yang sudah selesai sebelum sekarang, agar dock tetap kosong untuk pengujian.
          if (!absen && waktuSelesai > sekarang) continue;
          if (absen && mulaiSlot > sekarang) continue;

          urutKode += 1;
          const kode = `BK-${tanggal.replace(/-/g, "")}-${String(urutKode).padStart(4, "0")}`;
          const tglPesan = addMin(mulaiSlot, -rng.antara(60 * 14, 60 * 50));
          const [p] = await conn.query(
            `INSERT INTO pemesanan (kode_booking, id_pengguna, id_truk, id_slot, tgl_pesan, status_pemesanan)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [kode, item.id_pengguna, item.id_truk, slot.id_slot, dateTime(tglPesan), absen ? "tidak hadir" : "check-in"],
          );
          if (absen) {
            tidakHadir += 1;
            continue;
          }

          urutAntrian += 1;
          dockBebas.set(idDock, waktuSelesai);
          const estimasi = new Date(Math.max(item.tiba.getTime(), mulaiSlot.getTime()));
          await conn.query(
            `INSERT INTO antrian (id_pemesanan, id_dock, id_petugas, nomor_antrian, waktu_kedatangan,
                                  waktu_mulai, waktu_selesai, estimasi_waktu, status_antrian)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'selesai')`,
            [
              p.insertId,
              idDock,
              idPetugas,
              `A-${String(urutAntrian).padStart(3, "0")}`,
              dateTime(item.tiba),
              dateTime(waktuMulai),
              dateTime(waktuSelesai),
              dateTime(estimasi),
            ],
          );
          selesai += 1;
        }
      }
      ringkasan.push({ tanggal, "antrian selesai": selesai, "tidak hadir": tidakHadir });
    }

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  }

  console.log(`Data contoh dibuat: ${SOPIR.length} akun sopir (sopir.contoh1${DOMAIN} sampai sopir.contoh${SOPIR.length}${DOMAIN}, kata sandi sopir123).`);
  console.table(ringkasan);
  console.log("Hapus kapan saja dengan: npm run db:contoh -- --hapus");
}

try {
  if (process.argv.includes("--hapus")) await hapusContoh();
  else await isiContoh();
} catch (err) {
  console.error("Gagal memproses data contoh:", err.message);
  process.exitCode = 1;
} finally {
  await conn.end();
}
