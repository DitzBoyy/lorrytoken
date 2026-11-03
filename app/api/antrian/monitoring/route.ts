import { NextResponse } from "next/server";
import { serverError } from "@/lib/api";
import { requireApiRole } from "@/lib/auth";
import { getMonitoring } from "@/lib/data/petugas";

/** Data Monitoring Antrian (kartu dock dan antrian menunggu). Diambil ulang setiap 5 detik. */
export async function GET() {
  const auth = await requireApiRole("petugas");
  if (auth.response) return auth.response;
  try {
    return NextResponse.json(await getMonitoring(), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return serverError(error);
  }
}
