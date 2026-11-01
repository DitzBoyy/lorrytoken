import { jwtVerify, SignJWT } from "jose";
import type { Role } from "./navigation";

/**
 * Sesi berupa JWT yang ditandatangani (HS256) dan disimpan di cookie httpOnly.
 * File ini tidak menyentuh database sehingga bisa dipakai oleh proxy.ts.
 */

export const SESSION_COOKIE = "loory_session";
export const SESSION_MAX_AGE = 60 * 60 * 12; // 12 jam, cukup untuk satu hari kerja

export type SessionPayload = {
  id: number;
  nama: string;
  role: Role;
};

const ROLES: readonly Role[] = ["sopir", "petugas", "manajemen"];

function secretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET belum diisi di .env.local (minimal 32 karakter).");
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ nama: payload.nama, role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(payload.id))
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secretKey());
}

/** Mengembalikan isi sesi, atau null bila token kosong, rusak, kedaluwarsa, atau role tidak dikenal. */
export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    const id = Number(payload.sub);
    const role = payload.role as Role;
    if (!Number.isInteger(id) || id <= 0 || !ROLES.includes(role) || typeof payload.nama !== "string") {
      return null;
    }
    return { id, nama: payload.nama, role };
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_MAX_AGE,
  // Prototipe dijalankan lewat http (localhost atau IP jaringan lokal untuk ponsel sopir),
  // jadi atribut Secure hanya dipasang bila COOKIE_SECURE=true (saat memakai https).
  secure: process.env.COOKIE_SECURE === "true",
};
