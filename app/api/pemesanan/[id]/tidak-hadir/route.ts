import { NextResponse } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { parseId, serverError } from "@/lib/api";
import { requireApiRole } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * Petugas menandai pemesanan sebagai "tidak hadir". Hanya untuk status "dipesan" yang tanggal slotnya
 * hari ini atau sudah lewat (truk belum mungkin terlambat untuk slot hari esok).
 */
export async function POST(_request: Request, { params }: RouteContext<"/api/pemesanan/[id]/tidak-hadir">) {
  const auth = await requireApiRole("petugas");
  if (auth.response) return auth.response;
  const id = parseId((await params).id);
  if (!id) return NextResponse.json({ message: "Data tidak ditemukan." }, { status: 404 });

  try {
    const [result] = await db.execute<ResultSetHeader>(
      `UPDATE pemesanan p JOIN slot_waktu s ON s.id_slot = p.id_slot
       SET p.status_pemesanan = 'tidak hadir'
       WHERE p.id_pemesanan = ? AND p.status_pemesanan = 'dipesan' AND s.tanggal <= CURDATE()`,
      [id],
    );
    if (result.affectedRows === 1) return NextResponse.json({ ok: true });

    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT p.status_pemesanan, s.tanggal > CURDATE() AS akan_datang
       FROM pemesanan p JOIN slot_waktu s ON s.id_slot = p.id_slot WHERE p.id_pemesanan = ?`,
      [id],
    );
    if (!rows[0]) return NextResponse.json({ message: "Data tidak ditemukan." }, { status: 404 });
    if (rows[0].status_pemesanan !== "dipesan") {
      return NextResponse.json(
        { message: `Pemesanan berstatus ${rows[0].status_pemesanan} tidak bisa ditandai tidak hadir.` },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { message: "Slot pemesanan ini belum tiba, jadi belum bisa ditandai tidak hadir." },
      { status: 409 },
    );
  } catch (error) {
    return serverError(error);
  }
}
