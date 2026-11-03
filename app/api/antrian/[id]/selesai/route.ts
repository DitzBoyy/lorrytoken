import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { Ditolak, parseId, tolakAtauError } from "@/lib/api";
import { requireApiRole } from "@/lib/auth";
import { withTransaction } from "@/lib/db";

/**
 * Tombol Selesai (CLAUDE.md bagian 6): waktu_selesai = sekarang, status "selesai",
 * dan dock kembali "tersedia".
 */
export async function POST(_request: Request, { params }: RouteContext<"/api/antrian/[id]/selesai">) {
  const auth = await requireApiRole("petugas");
  if (auth.response) return auth.response;
  const idAntrian = parseId((await params).id);
  if (!idAntrian) return NextResponse.json({ message: "Antrian tidak ditemukan." }, { status: 404 });

  try {
    const hasil = await withTransaction(async (conn) => {
      const [rows] = await conn.execute<RowDataPacket[]>(
        "SELECT nomor_antrian, status_antrian, id_dock FROM antrian WHERE id_antrian = ? FOR UPDATE",
        [idAntrian],
      );
      const antrian = rows[0];
      if (!antrian) throw new Ditolak("Antrian tidak ditemukan.", 404);
      if (antrian.status_antrian !== "dimuat") {
        throw new Ditolak(`Antrian ${antrian.nomor_antrian} berstatus ${antrian.status_antrian}, bukan dimuat.`);
      }

      await conn.execute(
        "UPDATE antrian SET waktu_selesai = NOW(), status_antrian = 'selesai' WHERE id_antrian = ?",
        [idAntrian],
      );
      if (antrian.id_dock) {
        await conn.execute("UPDATE loading_dock SET status_dock = 'tersedia' WHERE id_dock = ? AND status_dock = 'digunakan'", [
          antrian.id_dock,
        ]);
      }
      return { nomor_antrian: antrian.nomor_antrian as string };
    });
    return NextResponse.json(hasil);
  } catch (error) {
    return tolakAtauError(error);
  }
}
