import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { db } from "./db";
import { ROLE_HOME, type Role } from "./navigation";
import { SESSION_COOKIE, verifySession } from "./session";

export type CurrentUser = {
  id: number;
  nama: string;
  email: string;
  role: Role;
};

/**
 * Membaca sesi dari cookie lalu memastikan penggunanya masih ada di database.
 * Akun yang dihapus atau rolenya diubah langsung kehilangan akses walaupun tokennya belum kedaluwarsa.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = await verifySession(token);
  if (!session) return null;

  const [rows] = await db.execute<(RowDataPacket & CurrentUser)[]>(
    "SELECT id_pengguna AS id, nama, email, role FROM pengguna WHERE id_pengguna = ? LIMIT 1",
    [session.id],
  );
  const user = rows[0];
  if (!user || user.role !== session.role) return null;
  return { id: user.id, nama: user.nama, email: user.email, role: user.role };
}

/** Untuk layout dan halaman: belum login ke /login, role lain ke halaman awal role-nya. */
export async function requirePageRole(role: Role): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== role) redirect(ROLE_HOME[user.role]);
  return user;
}

type ApiAuthResult = { user: CurrentUser; response?: never } | { user?: never; response: NextResponse };

/**
 * Untuk API route: dipanggil di awal setiap handler.
 * Mengembalikan `response` 401/403 yang langsung dikembalikan bila akses ditolak.
 */
export async function requireApiRole(...roles: Role[]): Promise<ApiAuthResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { response: NextResponse.json({ message: "Sesi berakhir. Silakan masuk kembali." }, { status: 401 }) };
  }
  if (!roles.includes(user.role)) {
    return { response: NextResponse.json({ message: "Anda tidak memiliki akses ke data ini." }, { status: 403 }) };
  }
  return { user };
}
