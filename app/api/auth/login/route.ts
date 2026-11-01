import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { db, isConnectionError } from "@/lib/db";
import { ROLE_HOME, type Role } from "@/lib/navigation";
import { SESSION_COOKIE, sessionCookieOptions, signSession } from "@/lib/session";
import { normalizeEmail, type FieldErrors } from "@/lib/validation";

type UserRow = RowDataPacket & { id_pengguna: number; nama: string; password: string; role: Role };

// Hash pembanding agar waktu respons sama walaupun email tidak terdaftar.
const DUMMY_HASH = "$2b$10$1UTT.lfXlChBBxGW1N0xT.KqF1modche4pnzQc.sN/T30DKk33uiS";

export async function POST(request: Request) {
  let body: { email?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Permintaan tidak valid." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? normalizeEmail(body.email) : "";
  const password = typeof body.password === "string" ? body.password : "";

  const errors: FieldErrors = {};
  if (!email) errors.email = "Email wajib diisi.";
  if (!password) errors.password = "Kata sandi wajib diisi.";
  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ message: "Email dan kata sandi wajib diisi.", errors }, { status: 400 });
  }

  let user: UserRow | undefined;
  try {
    const [rows] = await db.execute<UserRow[]>(
      "SELECT id_pengguna, nama, password, role FROM pengguna WHERE email = ? LIMIT 1",
      [email],
    );
    user = rows[0];
  } catch (error) {
    console.error("Login gagal karena database:", error);
    const message = isConnectionError(error)
      ? "Server tidak dapat terhubung ke database. Hubungi petugas."
      : "Terjadi kesalahan pada server. Coba lagi.";
    return NextResponse.json({ message }, { status: 500 });
  }

  const passwordOk = await bcrypt.compare(password, user?.password ?? DUMMY_HASH);
  if (!user || !passwordOk) {
    return NextResponse.json({ message: "Login gagal. Email atau kata sandi salah." }, { status: 401 });
  }

  const token = await signSession({ id: user.id_pengguna, nama: user.nama, role: user.role });
  const response = NextResponse.json({ redirectTo: ROLE_HOME[user.role] });
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
  return response;
}
