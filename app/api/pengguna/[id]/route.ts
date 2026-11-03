import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { parseId, serverError } from "@/lib/api";
import { requireApiRole } from "@/lib/auth";
import { db, isDuplicateError } from "@/lib/db";
import { parsePetugasBody } from "@/lib/pengguna-input";

const EMAIL_TERPAKAI = "Email ini sudah dipakai akun lain.";
const TIDAK_DITEMUKAN = "Akun petugas tidak ditemukan.";

/** Mengubah akun petugas. Kata sandi hanya diganti bila diisi. Akun selain petugas tidak bisa diubah di sini. */
export async function PATCH(request: Request, { params }: RouteContext<"/api/pengguna/[id]">) {
  const auth = await requireApiRole("manajemen");
  if (auth.response) return auth.response;

  const id = parseId((await params).id);
  if (!id) return NextResponse.json({ message: TIDAK_DITEMUKAN }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Permintaan tidak valid." }, { status: 400 });
  }
  const { data, errors } = parsePetugasBody(body, false);
  if (!data) return NextResponse.json({ message: "Periksa kembali data yang ditandai.", errors }, { status: 400 });

  try {
    const [dupes] = await db.execute<RowDataPacket[]>(
      "SELECT 1 FROM pengguna WHERE email = ? AND id_pengguna <> ? LIMIT 1",
      [data.email, id],
    );
    if (dupes.length > 0) {
      return NextResponse.json({ message: "Periksa kembali data yang ditandai.", errors: { email: EMAIL_TERPAKAI } }, { status: 409 });
    }

    const [result] = data.password
      ? await db.execute<ResultSetHeader>(
          "UPDATE pengguna SET nama = ?, email = ?, no_hp = ?, password = ? WHERE id_pengguna = ? AND role = 'petugas'",
          [data.nama, data.email, data.no_hp, await bcrypt.hash(data.password, 10), id],
        )
      : await db.execute<ResultSetHeader>(
          "UPDATE pengguna SET nama = ?, email = ?, no_hp = ? WHERE id_pengguna = ? AND role = 'petugas'",
          [data.nama, data.email, data.no_hp, id],
        );
    if (result.affectedRows === 0) return NextResponse.json({ message: TIDAK_DITEMUKAN }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (isDuplicateError(error)) {
      return NextResponse.json({ message: "Periksa kembali data yang ditandai.", errors: { email: EMAIL_TERPAKAI } }, { status: 409 });
    }
    return serverError(error);
  }
}

/**
 * Menghapus akun petugas. Ditolak bila akun pernah mencatat check-in,
 * karena antrian.id_petugas merujuk ke akun itu dan riwayat laporan harus tetap utuh.
 */
export async function DELETE(_request: Request, { params }: RouteContext<"/api/pengguna/[id]">) {
  const auth = await requireApiRole("manajemen");
  if (auth.response) return auth.response;

  const id = parseId((await params).id);
  if (!id) return NextResponse.json({ message: TIDAK_DITEMUKAN }, { status: 404 });

  try {
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT u.id_pengguna, COUNT(a.id_antrian) AS jumlah
       FROM pengguna u LEFT JOIN antrian a ON a.id_petugas = u.id_pengguna
       WHERE u.id_pengguna = ? AND u.role = 'petugas'
       GROUP BY u.id_pengguna`,
      [id],
    );
    if (rows.length === 0) return NextResponse.json({ message: TIDAK_DITEMUKAN }, { status: 404 });
    const jumlah = Number(rows[0].jumlah);
    if (jumlah > 0) {
      return NextResponse.json(
        { message: `Akun ini sudah mencatat ${jumlah} check-in, jadi tidak bisa dihapus agar riwayat antrian tetap utuh.` },
        { status: 409 },
      );
    }
    await db.execute("DELETE FROM pengguna WHERE id_pengguna = ? AND role = 'petugas'", [id]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return serverError(error);
  }
}
