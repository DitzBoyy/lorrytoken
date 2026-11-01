import { NextResponse, type NextRequest } from "next/server";
import { ROLE_HOME, type Role } from "@/lib/navigation";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

/**
 * Pemeriksaan hak akses sebelum request sampai ke halaman atau API (Next.js 16: proxy, dulu middleware).
 * Ini lapis pertama. Setiap layout role dan setiap API route memeriksa ulang ke database.
 */

const ROLE_PREFIXES: Record<string, Role> = {
  "/sopir": "sopir",
  "/petugas": "petugas",
  "/manajemen": "manajemen",
};

const GUEST_ONLY = ["/login", "/registrasi"];

function roleForPath(pathname: string): Role | null {
  for (const [prefix, role] of Object.entries(ROLE_PREFIXES)) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) return role;
  }
  return null;
}

function redirectTo(request: NextRequest, pathname: string, clearCookie = false) {
  const response = NextResponse.redirect(new URL(pathname, request.url));
  if (clearCookie) response.cookies.delete(SESSION_COOKIE);
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySession(token);
  const staleCookie = Boolean(token) && !session;

  // API: hanya /api/auth yang terbuka. Role per endpoint diperiksa di handler masing-masing.
  if (pathname.startsWith("/api/")) {
    if (pathname.startsWith("/api/auth/")) return NextResponse.next();
    if (!session) {
      const response = NextResponse.json({ message: "Sesi berakhir. Silakan masuk kembali." }, { status: 401 });
      if (staleCookie) response.cookies.delete(SESSION_COOKIE);
      return response;
    }
    return NextResponse.next();
  }

  if (pathname === "/") {
    return redirectTo(request, session ? ROLE_HOME[session.role] : "/login", staleCookie);
  }

  if (GUEST_ONLY.includes(pathname)) {
    if (session) return redirectTo(request, ROLE_HOME[session.role]);
    if (staleCookie) {
      const response = NextResponse.next();
      response.cookies.delete(SESSION_COOKIE);
      return response;
    }
    return NextResponse.next();
  }

  const requiredRole = roleForPath(pathname);
  if (requiredRole) {
    if (!session) return redirectTo(request, "/login", staleCookie);
    // Membuka halaman milik role lain: kembali ke halaman awal role sendiri.
    if (session.role !== requiredRole) return redirectTo(request, ROLE_HOME[session.role]);
  }

  return NextResponse.next();
}

export const config = {
  // Lewati aset statis, gambar, dan foto truk.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|uploads/).*)"],
};
