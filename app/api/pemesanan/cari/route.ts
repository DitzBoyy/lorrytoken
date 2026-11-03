import { NextResponse } from "next/server";
import { serverError } from "@/lib/api";
import { requireApiRole } from "@/lib/auth";
import { cariPemesanan, nomorAntrianBerikutnya } from "@/lib/data/petugas";

/** Petugas mencari pemesanan dengan kode pemesanan atau nomor plat. GET /api/pemesanan/cari?q=... */
export async function GET(request: Request) {
  const auth = await requireApiRole("petugas");
  if (auth.response) return auth.response;

  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (!q) {
    return NextResponse.json({ message: "Kode pemesanan atau nomor plat wajib diisi." }, { status: 400 });
  }
  try {
    const [hasil, nomorBerikutnya] = await Promise.all([cariPemesanan(q), nomorAntrianBerikutnya()]);
    if (!hasil) {
      return NextResponse.json({ message: `Data tidak ditemukan untuk "${q}".` }, { status: 404 });
    }
    return NextResponse.json({ hasil, nomorBerikutnya });
  } catch (error) {
    return serverError(error);
  }
}
