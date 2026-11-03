import { NextResponse } from "next/server";
import { serverError } from "@/lib/api";
import { requireApiRole } from "@/lib/auth";
import { getDashboard } from "@/lib/data/manajemen";

/** Data Dashboard Antrian manajemen. Diambil ulang setiap 5 detik. */
export async function GET() {
  const auth = await requireApiRole("manajemen");
  if (auth.response) return auth.response;
  try {
    return NextResponse.json(await getDashboard(), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return serverError(error);
  }
}
