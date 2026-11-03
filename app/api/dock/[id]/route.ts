import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { Ditolak, parseId, tolakAtauError } from "@/lib/api";
import { requireApiRole } from "@/lib/auth";
import { withTransaction } from "@/lib/db";
import { parseDockBody } from "@/lib/dock-input";

/**
 * Ubah loading dock. Status dock yang sedang "digunakan" tidak bisa diubah sampai antriannya
 * ditandai selesai di Monitoring Antrian; nama dan keterangan tetap bisa diubah.
 */
export async function PATCH(request: Request, { params }: RouteContext<"/api/dock/[id]">) {
  const auth = await requireApiRole("petugas");
  if (auth.response) return auth.response;
  const id = parseId((await params).id);
  if (!id) return NextResponse.json({ message: "Loading dock tidak ditemukan." }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Permintaan tidak valid." }, { status: 400 });
  }

  try {
    await withTransaction(async (conn) => {
      const [rows] = await conn.execute<RowDataPacket[]>(
        "SELECT nama_dock, status_dock FROM loading_dock WHERE id_dock = ? FOR UPDATE",
        [id],
      );
      const lama = rows[0];
      if (!lama) throw new Ditolak("Loading dock tidak ditemukan.", 404);

      const digunakan = lama.status_dock === "digunakan";
      // Saat digunakan, status dikunci: pakai status lama agar validasi tidak menolak "digunakan".
      const { data, errors } = parseDockBody(digunakan ? { ...body, status_dock: "tersedia" } : body);
      if (!data) throw new Ditolak("Periksa kembali data yang ditandai.", 400, errors);
      if (digunakan && typeof body.status_dock === "string" && body.status_dock !== "digunakan") {
        throw new Ditolak(`${lama.nama_dock} sedang digunakan. Tandai pemuatannya selesai dulu sebelum mengubah status.`, 409, {
          status_dock: "Dock sedang digunakan.",
        });
      }

      await conn.execute("UPDATE loading_dock SET nama_dock = ?, status_dock = ?, keterangan = ? WHERE id_dock = ?", [
        data.nama_dock,
        digunakan ? "digunakan" : data.status_dock,
        data.keterangan,
        id,
      ]);
    });
    return NextResponse.json({ id_dock: id });
  } catch (error) {
    return tolakAtauError(error);
  }
}
