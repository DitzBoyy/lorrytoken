import { NextResponse } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { serverError } from "@/lib/api";
import { requireApiRole } from "@/lib/auth";
import { getSlotPerTanggal } from "@/lib/data/slot";
import { db } from "@/lib/db";
import { parseSlotBody } from "@/lib/slot-input";

/** Slot waktu satu tanggal beserta sisa kuotanya. GET /api/slot?tanggal=YYYY-MM-DD */
export async function GET(request: Request) {
  const auth = await requireApiRole("sopir", "petugas", "manajemen");
  if (auth.response) return auth.response;

  const tanggal = new URL(request.url).searchParams.get("tanggal") ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggal)) {
    return NextResponse.json({ message: "Parameter tanggal wajib berformat YYYY-MM-DD." }, { status: 400 });
  }
  try {
    return NextResponse.json({ slot: await getSlotPerTanggal(tanggal) });
  } catch (error) {
    return serverError(error);
  }
}

/** Petugas menambah slot waktu. Tanggal tidak boleh lampau dan jam tidak boleh bertumpuk dengan slot lain. */
export async function POST(request: Request) {
  const auth = await requireApiRole("petugas");
  if (auth.response) return auth.response;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Permintaan tidak valid." }, { status: 400 });
  }
  const { data, errors } = parseSlotBody(body);
  if (!data) return NextResponse.json({ message: "Periksa kembali data yang ditandai.", errors }, { status: 400 });

  try {
    const [cek] = await db.execute<RowDataPacket[]>(
      `SELECT (? < CURDATE()) AS lampau,
              (SELECT COUNT(*) FROM slot_waktu WHERE tanggal = ? AND jam_mulai < ? AND jam_selesai > ?) AS bertumpuk`,
      [data.tanggal, data.tanggal, data.jam_selesai, data.jam_mulai],
    );
    if (Number(cek[0].lampau)) {
      return NextResponse.json(
        { message: "Periksa kembali data yang ditandai.", errors: { tanggal: "Tanggal tidak boleh sebelum hari ini." } },
        { status: 400 },
      );
    }
    if (Number(cek[0].bertumpuk) > 0) {
      return NextResponse.json(
        { message: "Jam slot bertumpuk dengan slot lain pada tanggal yang sama.", errors: { jam_mulai: "Jam bertumpuk dengan slot lain." } },
        { status: 409 },
      );
    }
    const [result] = await db.execute<ResultSetHeader>(
      "INSERT INTO slot_waktu (tanggal, jam_mulai, jam_selesai, kuota, status_slot) VALUES (?, ?, ?, ?, ?)",
      [data.tanggal, data.jam_mulai, data.jam_selesai, data.kuota, data.status_slot],
    );
    return NextResponse.json({ id_slot: result.insertId, tanggal: data.tanggal }, { status: 201 });
  } catch (error) {
    return serverError(error);
  }
}
