import { NextResponse } from "next/server";
import type { ResultSetHeader } from "mysql2";
import { serverError } from "@/lib/api";
import { requireApiRole } from "@/lib/auth";
import { getDaftarDock } from "@/lib/data/petugas";
import { db } from "@/lib/db";
import { parseDockBody } from "@/lib/dock-input";

/** Daftar loading dock. */
export async function GET() {
  const auth = await requireApiRole("petugas", "manajemen");
  if (auth.response) return auth.response;
  try {
    return NextResponse.json({ dock: await getDaftarDock() });
  } catch (error) {
    return serverError(error);
  }
}

/** Petugas menambah loading dock. Dock baru berstatus tersedia atau nonaktif. */
export async function POST(request: Request) {
  const auth = await requireApiRole("petugas");
  if (auth.response) return auth.response;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Permintaan tidak valid." }, { status: 400 });
  }
  const { data, errors } = parseDockBody(body);
  if (!data) return NextResponse.json({ message: "Periksa kembali data yang ditandai.", errors }, { status: 400 });

  try {
    const [result] = await db.execute<ResultSetHeader>(
      "INSERT INTO loading_dock (nama_dock, status_dock, keterangan) VALUES (?, ?, ?)",
      [data.nama_dock, data.status_dock, data.keterangan],
    );
    return NextResponse.json({ id_dock: result.insertId }, { status: 201 });
  } catch (error) {
    return serverError(error);
  }
}
