import { NextResponse } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { Ditolak, serverError, tolakAtauError } from "@/lib/api";
import { requireApiRole } from "@/lib/auth";
import { getPemesananSopir } from "@/lib/data/pemesanan";
import { getTrukMilik } from "@/lib/data/truk";
import { withTransaction } from "@/lib/db";
import type { FieldErrors } from "@/lib/validation";

/** Riwayat pemesanan milik sopir yang login. */
export async function GET() {
  const auth = await requireApiRole("sopir");
  if (auth.response) return auth.response;
  try {
    return NextResponse.json({ pemesanan: await getPemesananSopir(auth.user.id) });
  } catch (error) {
    return serverError(error);
  }
}

const toId = (value: unknown) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

/**
 * Pesan slot. Pemeriksaan kuota dan penyimpanan berada dalam satu transaksi: semua slot pada tanggal
 * yang sama dikunci (SELECT ... FOR UPDATE), sehingga dua sopir tidak bisa mengambil kuota terakhir
 * bersamaan dan nomor urut kode booking per tanggal tidak bentrok.
 */
export async function POST(request: Request) {
  const auth = await requireApiRole("sopir");
  if (auth.response) return auth.response;

  let body: { id_slot?: unknown; id_truk?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Permintaan tidak valid." }, { status: 400 });
  }

  const idSlot = toId(body.id_slot);
  const idTruk = toId(body.id_truk);
  const errors: FieldErrors = {};
  if (!idSlot) errors.id_slot = "Slot waktu wajib dipilih.";
  if (!idTruk) errors.id_truk = "Truk wajib dipilih.";
  if (!idSlot || !idTruk) {
    return NextResponse.json({ message: errors.id_truk ?? errors.id_slot, errors }, { status: 400 });
  }

  try {
    const truk = await getTrukMilik(idTruk, auth.user.id);
    if (!truk) {
      return NextResponse.json(
        { message: "Truk wajib dipilih.", errors: { id_truk: "Truk tidak ditemukan di data truk Anda." } },
        { status: 400 },
      );
    }

    const hasil = await withTransaction(async (conn) => {
      const [target] = await conn.execute<RowDataPacket[]>(
        "SELECT DATE_FORMAT(tanggal, '%Y-%m-%d') AS tanggal FROM slot_waktu WHERE id_slot = ?",
        [idSlot],
      );
      if (!target[0]) throw new Ditolak("Slot waktu tidak ditemukan.", 404);
      const tanggal = target[0].tanggal as string;

      const [slotHariItu] = await conn.execute<RowDataPacket[]>(
        `SELECT id_slot, kuota, status_slot,
                (tanggal < CURDATE() OR (tanggal = CURDATE() AND jam_selesai <= CURTIME())) AS lewat
         FROM slot_waktu WHERE tanggal = ? FOR UPDATE`,
        [tanggal],
      );
      const slot = slotHariItu.find((row) => row.id_slot === idSlot);
      if (!slot) throw new Ditolak("Slot waktu tidak ditemukan.", 404);
      if (slot.status_slot !== "aktif") throw new Ditolak("Slot ini tidak aktif. Pilih slot waktu lain.");
      if (Number(slot.lewat)) throw new Ditolak("Slot ini sudah lewat. Pilih slot waktu lain.");

      const [pakai] = await conn.execute<RowDataPacket[]>(
        `SELECT COUNT(*) AS terpakai,
                SUM(id_truk = ? AND status_pemesanan IN ('dipesan', 'check-in')) AS truk_sama
         FROM pemesanan WHERE id_slot = ? AND status_pemesanan <> 'dibatalkan'`,
        [idTruk, idSlot],
      );
      if (Number(pakai[0].terpakai) >= Number(slot.kuota)) {
        throw new Ditolak("Slot penuh. Pilih slot waktu lain.");
      }
      if (Number(pakai[0].truk_sama ?? 0) > 0) {
        throw new Ditolak(`Truk ${truk.no_polisi} sudah dipesan di slot ini.`);
      }

      // Kode booking: BK-YYYYMMDD-NNNN, nomor urut per tanggal slot.
      const prefix = `BK-${tanggal.replace(/-/g, "")}-`;
      const [terakhir] = await conn.execute<RowDataPacket[]>(
        "SELECT MAX(kode_booking) AS kode FROM pemesanan WHERE kode_booking LIKE ?",
        [`${prefix}%`],
      );
      const urut = terakhir[0]?.kode ? Number(String(terakhir[0].kode).slice(prefix.length)) + 1 : 1;
      if (urut > 9999) throw new Ditolak("Nomor pemesanan untuk tanggal ini sudah habis.");
      const kode = `${prefix}${String(urut).padStart(4, "0")}`;

      const [insert] = await conn.execute<ResultSetHeader>(
        `INSERT INTO pemesanan (kode_booking, id_pengguna, id_truk, id_slot, tgl_pesan, status_pemesanan)
         VALUES (?, ?, ?, ?, NOW(), 'dipesan')`,
        [kode, auth.user.id, idTruk, idSlot],
      );
      return { id_pemesanan: insert.insertId, kode_booking: kode };
    });

    return NextResponse.json(hasil, { status: 201 });
  } catch (error) {
    return tolakAtauError(error);
  }
}
