import { NextResponse } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { parseId, serverError } from "@/lib/api";
import { requireApiRole } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * Sopir membatalkan pemesanannya sendiri. Hanya status "dipesan" yang bisa dibatalkan.
 * Kuota slot kembali otomatis karena sisa kuota menghitung pemesanan yang bukan dibatalkan.
 */
export async function POST(_request: Request, { params }: RouteContext<"/api/pemesanan/[id]/batal">) {
  const auth = await requireApiRole("sopir");
  if (auth.response) return auth.response;
  const id = parseId((await params).id);
  if (!id) return NextResponse.json({ message: "Pemesanan tidak ditemukan." }, { status: 404 });

  try {
    const [result] = await db.execute<ResultSetHeader>(
      `UPDATE pemesanan SET status_pemesanan = 'dibatalkan'
       WHERE id_pemesanan = ? AND id_pengguna = ? AND status_pemesanan = 'dipesan'`,
      [id, auth.user.id],
    );
    if (result.affectedRows === 1) return NextResponse.json({ ok: true });

    const [rows] = await db.execute<RowDataPacket[]>(
      "SELECT status_pemesanan FROM pemesanan WHERE id_pemesanan = ? AND id_pengguna = ?",
      [id, auth.user.id],
    );
    if (!rows[0]) return NextResponse.json({ message: "Pemesanan tidak ditemukan." }, { status: 404 });
    return NextResponse.json(
      { message: `Pemesanan berstatus ${rows[0].status_pemesanan} tidak bisa dibatalkan.` },
      { status: 409 },
    );
  } catch (error) {
    return serverError(error);
  }
}
