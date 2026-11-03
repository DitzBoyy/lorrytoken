import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { serverError } from "@/lib/api";
import { requireApiRole } from "@/lib/auth";
import { getDaftarPetugas } from "@/lib/data/manajemen";
import { db, isDuplicateError } from "@/lib/db";
import { parsePetugasBody } from "@/lib/pengguna-input";

const EMAIL_TERPAKAI = "Email ini sudah dipakai akun lain.";

/** Daftar akun petugas. */
export async function GET() {
  const auth = await requireApiRole("manajemen");
  if (auth.response) return auth.response;
  try {
    return NextResponse.json({ petugas: await getDaftarPetugas() });
  } catch (error) {
    return serverError(error);
  }
}

/** Manajemen membuat akun petugas. Role selalu "petugas", nilai role dari request diabaikan. */
export async function POST(request: Request) {
  const auth = await requireApiRole("manajemen");
  if (auth.response) return auth.response;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Permintaan tidak valid." }, { status: 400 });
  }
  const { data, errors } = parsePetugasBody(body, true);
  if (!data || !data.password) {
    return NextResponse.json({ message: "Periksa kembali data yang ditandai.", errors }, { status: 400 });
  }

  try {
    const [dupes] = await db.execute<RowDataPacket[]>("SELECT 1 FROM pengguna WHERE email = ? LIMIT 1", [data.email]);
    if (dupes.length > 0) {
      return NextResponse.json({ message: "Periksa kembali data yang ditandai.", errors: { email: EMAIL_TERPAKAI } }, { status: 409 });
    }
    const hash = await bcrypt.hash(data.password, 10);
    const [result] = await db.execute<ResultSetHeader>(
      "INSERT INTO pengguna (nama, email, no_hp, password, role) VALUES (?, ?, ?, ?, 'petugas')",
      [data.nama, data.email, data.no_hp, hash],
    );
    return NextResponse.json({ id_pengguna: result.insertId }, { status: 201 });
  } catch (error) {
    if (isDuplicateError(error)) {
      return NextResponse.json({ message: "Periksa kembali data yang ditandai.", errors: { email: EMAIL_TERPAKAI } }, { status: 409 });
    }
    return serverError(error);
  }
}
