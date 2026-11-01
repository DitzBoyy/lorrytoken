import { NextResponse } from "next/server";
import { serverError } from "@/lib/api";
import { requireApiRole } from "@/lib/auth";
import { getStatusSopir } from "@/lib/data/pemesanan";

/**
 * Status antrian milik sopir yang login. Diambil ulang oleh halaman Status Antrian setiap 5 detik.
 * GET /api/antrian/saya?kode=BK-YYYYMMDD-NNNN (kode opsional)
 */
export async function GET(request: Request) {
  const auth = await requireApiRole("sopir");
  if (auth.response) return auth.response;
  const kode = new URL(request.url).searchParams.get("kode");
  try {
    return NextResponse.json(await getStatusSopir(auth.user.id, kode), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return serverError(error);
  }
}
