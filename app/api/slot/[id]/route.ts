import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { Ditolak, parseId, tolakAtauError } from "@/lib/api";
import { requireApiRole } from "@/lib/auth";
import { withTransaction } from "@/lib/db";
import { parseSlotBody } from "@/lib/slot-input";

type Context = RouteContext<"/api/slot/[id]">;

/**
 * Ubah slot waktu. Kuota tidak boleh lebih kecil dari pemesanan yang sudah ada di slot itu
 * (pemesanan selain dibatalkan), dan jam tidak boleh bertumpuk dengan slot lain.
 */
export async function PATCH(request: Request, { params }: Context) {
  const auth = await requireApiRole("petugas");
  if (auth.response) return auth.response;
  const id = parseId((await params).id);
  if (!id) return NextResponse.json({ message: "Slot waktu tidak ditemukan." }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Permintaan tidak valid." }, { status: 400 });
  }
  const { data, errors } = parseSlotBody(body);
  if (!data) return NextResponse.json({ message: "Periksa kembali data yang ditandai.", errors }, { status: 400 });

  try {
    await withTransaction(async (conn) => {
      const [slot] = await conn.execute<RowDataPacket[]>("SELECT id_slot FROM slot_waktu WHERE id_slot = ? FOR UPDATE", [id]);
      if (!slot[0]) throw new Ditolak("Slot waktu tidak ditemukan.", 404);

      const [cek] = await conn.execute<RowDataPacket[]>(
        `SELECT (SELECT COUNT(*) FROM pemesanan WHERE id_slot = ? AND status_pemesanan <> 'dibatalkan') AS terpakai,
                (SELECT COUNT(*) FROM pemesanan WHERE id_slot = ?) AS semua,
                (SELECT COUNT(*) FROM slot_waktu WHERE id_slot <> ? AND tanggal = ? AND jam_mulai < ? AND jam_selesai > ?) AS bertumpuk`,
        [id, id, id, data.tanggal, data.jam_selesai, data.jam_mulai],
      );
      const terpakai = Number(cek[0].terpakai);
      if (data.kuota < terpakai) {
        throw new Ditolak(`Kuota tidak boleh kurang dari ${terpakai}, jumlah pemesanan di slot ini.`, 409, {
          kuota: `Minimal ${terpakai}.`,
        });
      }
      if (Number(cek[0].bertumpuk) > 0) {
        throw new Ditolak("Jam slot bertumpuk dengan slot lain pada tanggal yang sama.", 409, {
          jam_mulai: "Jam bertumpuk dengan slot lain.",
        });
      }
      // Tanggal dan jam slot yang sudah punya pemesanan tidak dipindah, agar kode booking dan jadwal sopir tetap benar.
      const [lama] = await conn.execute<RowDataPacket[]>(
        "SELECT DATE_FORMAT(tanggal, '%Y-%m-%d') AS tanggal, jam_mulai, jam_selesai FROM slot_waktu WHERE id_slot = ?",
        [id],
      );
      const pindah =
        lama[0].tanggal !== data.tanggal || lama[0].jam_mulai !== data.jam_mulai || lama[0].jam_selesai !== data.jam_selesai;
      if (pindah && Number(cek[0].semua) > 0) {
        throw new Ditolak("Tanggal dan jam slot yang sudah punya pemesanan tidak bisa diubah. Ubah kuota atau status saja.");
      }

      await conn.execute(
        "UPDATE slot_waktu SET tanggal = ?, jam_mulai = ?, jam_selesai = ?, kuota = ?, status_slot = ? WHERE id_slot = ?",
        [data.tanggal, data.jam_mulai, data.jam_selesai, data.kuota, data.status_slot, id],
      );
    });
    return NextResponse.json({ id_slot: id, tanggal: data.tanggal });
  } catch (error) {
    return tolakAtauError(error);
  }
}

/** Hapus slot waktu. Slot yang sudah punya pemesanan tidak bisa dihapus; nonaktifkan saja. */
export async function DELETE(_request: Request, { params }: Context) {
  const auth = await requireApiRole("petugas");
  if (auth.response) return auth.response;
  const id = parseId((await params).id);
  if (!id) return NextResponse.json({ message: "Slot waktu tidak ditemukan." }, { status: 404 });

  try {
    await withTransaction(async (conn) => {
      const [slot] = await conn.execute<RowDataPacket[]>("SELECT id_slot FROM slot_waktu WHERE id_slot = ? FOR UPDATE", [id]);
      if (!slot[0]) throw new Ditolak("Slot waktu tidak ditemukan.", 404);
      const [pakai] = await conn.execute<RowDataPacket[]>("SELECT COUNT(*) AS jumlah FROM pemesanan WHERE id_slot = ?", [id]);
      if (Number(pakai[0].jumlah) > 0) {
        throw new Ditolak("Slot ini sudah punya pemesanan sehingga tidak bisa dihapus. Ubah statusnya menjadi nonaktif.");
      }
      await conn.execute("DELETE FROM slot_waktu WHERE id_slot = ?", [id]);
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return tolakAtauError(error);
  }
}
