import { NextResponse } from "next/server";
import { serverError } from "@/lib/api";
import { requireApiRole } from "@/lib/auth";
import { getLaporan } from "@/lib/data/manajemen";
import { parsePeriode } from "@/lib/laporan-input";

/** Laporan periode: GET /api/laporan?awal=YYYY-MM-DD&akhir=YYYY-MM-DD */
export async function GET(request: Request) {
  const auth = await requireApiRole("manajemen");
  if (auth.response) return auth.response;

  const { searchParams } = new URL(request.url);
  const periode = parsePeriode(searchParams.get("awal"), searchParams.get("akhir"));
  if (!periode.ok) {
    return NextResponse.json({ message: "Periksa kembali periode laporan.", errors: periode.errors }, { status: 400 });
  }
  try {
    return NextResponse.json(await getLaporan(periode.awal, periode.akhir), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return serverError(error);
  }
}
