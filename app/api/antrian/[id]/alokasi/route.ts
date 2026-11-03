import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { Ditolak, parseId, tolakAtauError } from "@/lib/api";
import { requireApiRole } from "@/lib/auth";
import { withTransaction } from "@/lib/db";

/**
 * Alokasi antrian "menunggu" ke dock "tersedia" (CLAUDE.md bagian 6):
 * id_dock diisi, waktu_mulai = sekarang, status "dimuat", dan dock menjadi "digunakan".
 * Baris antrian dan dock dikunci agar dua petugas tidak mengisi dock yang sama.
 */
export async function POST(request: Request, { params }: RouteContext<"/api/antrian/[id]/alokasi">) {
  const auth = await requireApiRole("petugas");
  if (auth.response) return auth.response;
  const idAntrian = parseId((await params).id);
  if (!idAntrian) return NextResponse.json({ message: "Antrian tidak ditemukan." }, { status: 404 });

  let body: { id_dock?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Permintaan tidak valid." }, { status: 400 });
  }
  const idDock = Number(body.id_dock);
  if (!Number.isInteger(idDock) || idDock <= 0) {
    return NextResponse.json({ message: "Loading dock wajib dipilih." }, { status: 400 });
  }

  try {
    const hasil = await withTransaction(async (conn) => {
      const [antrian] = await conn.execute<RowDataPacket[]>(
        "SELECT nomor_antrian, status_antrian FROM antrian WHERE id_antrian = ? FOR UPDATE",
        [idAntrian],
      );
      if (!antrian[0]) throw new Ditolak("Antrian tidak ditemukan.", 404);
      if (antrian[0].status_antrian !== "menunggu") {
        throw new Ditolak(`Antrian ${antrian[0].nomor_antrian} sudah berstatus ${antrian[0].status_antrian}.`);
      }

      const [dock] = await conn.execute<RowDataPacket[]>(
        "SELECT nama_dock, status_dock FROM loading_dock WHERE id_dock = ? FOR UPDATE",
        [idDock],
      );
      if (!dock[0]) throw new Ditolak("Loading dock tidak ditemukan.", 404);
      if (dock[0].status_dock !== "tersedia") {
        throw new Ditolak(`${dock[0].nama_dock} sedang ${dock[0].status_dock}. Pilih dock lain.`);
      }

      await conn.execute(
        "UPDATE antrian SET id_dock = ?, waktu_mulai = NOW(), status_antrian = 'dimuat' WHERE id_antrian = ?",
        [idDock, idAntrian],
      );
      await conn.execute("UPDATE loading_dock SET status_dock = 'digunakan' WHERE id_dock = ?", [idDock]);
      return { nomor_antrian: antrian[0].nomor_antrian as string, nama_dock: dock[0].nama_dock as string };
    });
    return NextResponse.json(hasil);
  } catch (error) {
    return tolakAtauError(error);
  }
}
