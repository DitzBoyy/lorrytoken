import { NextResponse } from "next/server";
import { serverError } from "@/lib/api";
import { requireApiRole } from "@/lib/auth";
import { getSlotPerTanggal } from "@/lib/data/slot";

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
