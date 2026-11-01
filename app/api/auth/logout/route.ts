import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";

/**
 * Logout lewat POST (tombol Keluar di sidebar adalah form). Cookie sesi dihapus lalu
 * browser diarahkan ke /login dengan status 303 agar request berikutnya memakai GET.
 */
export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/login", request.url), 303);
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
