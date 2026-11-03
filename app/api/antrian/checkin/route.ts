import { NextResponse } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { Ditolak, tolakAtauError } from "@/lib/api";
import { requireApiRole } from "@/lib/auth";
import { estimasiMulai, toDateTimeString } from "@/lib/data/antrian";
import { nomorAntrianBerikutnya } from "@/lib/data/petugas";
import { withLockedTransaction } from "@/lib/db";

/**
 * Check-in kedatangan truk (CLAUDE.md bagian 6).
 * Hanya untuk pemesanan "dipesan" yang tanggal slotnya hari ini. Dalam satu transaksi:
 * status pemesanan menjadi "check-in", baris antrian dibuat dengan nomor A-NNN (direset setiap hari),
 * waktu kedatangan = sekarang, status "menunggu", dan estimasi waktu mulai dihitung.
 */
export async function POST(request: Request) {
  const auth = await requireApiRole("petugas");
  if (auth.response) return auth.response;

  let body: { id_pemesanan?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Permintaan tidak valid." }, { status: 400 });
  }
  const idPemesanan = Number(body.id_pemesanan);
  if (!Number.isInteger(idPemesanan) || idPemesanan <= 0) {
    return NextResponse.json({ message: "Pemesanan wajib dipilih." }, { status: 400 });
  }

  try {
    // Kunci bernama: dua check-in bersamaan tidak mendapat nomor antrian yang sama.
    const hasil = await withLockedTransaction(
      "loory_nomor_antrian",
      async (conn) => {
        const [rows] = await conn.execute<RowDataPacket[]>(
          `SELECT p.id_pemesanan, p.kode_booking, p.status_pemesanan,
                  DATE_FORMAT(s.tanggal, '%Y-%m-%d') AS tanggal, s.jam_mulai, (s.tanggal = CURDATE()) AS hari_ini
           FROM pemesanan p JOIN slot_waktu s ON s.id_slot = p.id_slot
           WHERE p.id_pemesanan = ? FOR UPDATE`,
          [idPemesanan],
        );
        const p = rows[0];
        if (!p) throw new Ditolak("Data tidak ditemukan.", 404);
        if (p.status_pemesanan !== "dipesan") {
          throw new Ditolak(`Pemesanan berstatus ${p.status_pemesanan} tidak bisa di-check-in.`);
        }
        if (!Number(p.hari_ini)) throw new Ditolak("Check-in hanya untuk pemesanan dengan slot hari ini.");

        const nomor = await nomorAntrianBerikutnya(conn);
        // Truk baru masuk di urutan paling belakang: semua yang menunggu hari ini ada di depannya.
        const [depan] = await conn.query<RowDataPacket[]>(
          "SELECT COUNT(*) AS jumlah FROM antrian WHERE status_antrian = 'menunggu' AND DATE(waktu_kedatangan) = CURDATE()",
        );
        const trukDiDepan = Number(depan[0]?.jumlah ?? 0);
        const estimasi = await estimasiMulai(p.tanggal, p.jam_mulai, trukDiDepan, conn);
        const estimasiText = estimasi ? toDateTimeString(estimasi) : null;

        await conn.execute("UPDATE pemesanan SET status_pemesanan = 'check-in' WHERE id_pemesanan = ?", [idPemesanan]);
        const [insert] = await conn.execute<ResultSetHeader>(
          `INSERT INTO antrian (id_pemesanan, id_dock, id_petugas, nomor_antrian, waktu_kedatangan, estimasi_waktu, status_antrian)
           VALUES (?, NULL, ?, ?, NOW(), ?, 'menunggu')`,
          [idPemesanan, auth.user.id, nomor, estimasiText],
        );
        const [waktu] = await conn.query<RowDataPacket[]>("SELECT waktu_kedatangan FROM antrian WHERE id_antrian = ?", [
          insert.insertId,
        ]);
        return {
          id_antrian: insert.insertId,
          kode_booking: p.kode_booking as string,
          nomor_antrian: nomor,
          waktu_kedatangan: waktu[0]?.waktu_kedatangan as string,
          estimasi_waktu: estimasiText,
          truk_di_depan: trukDiDepan,
        };
      },
      () => new Ditolak("Server sedang sibuk. Coba lagi.", 503),
    );
    return NextResponse.json(hasil, { status: 201 });
  } catch (error) {
    return tolakAtauError(error);
  }
}
