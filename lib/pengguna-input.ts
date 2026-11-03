import "server-only";
import { EMAIL_PATTERN, isValidPhone, normalizeEmail, normalizePhone, PASSWORD_MIN, type FieldErrors } from "./validation";

export type PetugasInput = { nama: string; email: string; no_hp: string; password: string | null };

/** Validasi form akun petugas. Saat mengubah akun, kata sandi kosong berarti tidak diganti. */
export function parsePetugasBody(
  body: Record<string, unknown>,
  passwordWajib: boolean,
): { data: PetugasInput | null; errors: FieldErrors } {
  const text = (key: string) => (typeof body[key] === "string" ? (body[key] as string).trim() : "");
  const errors: FieldErrors = {};

  const nama = text("nama").replace(/\s+/g, " ");
  if (!nama) errors.nama = "Nama wajib diisi.";
  else if (nama.length > 100) errors.nama = "Nama maksimal 100 karakter.";

  const email = normalizeEmail(text("email"));
  if (!email) errors.email = "Email wajib diisi.";
  else if (!EMAIL_PATTERN.test(email) || email.length > 100) errors.email = "Format email tidak valid.";

  const noHp = normalizePhone(text("no_hp"));
  if (!text("no_hp")) errors.no_hp = "Nomor HP wajib diisi.";
  else if (!isValidPhone(noHp)) errors.no_hp = "Nomor HP diawali 0 dan berisi 9 sampai 15 angka.";

  const password = typeof body.password === "string" ? body.password : "";
  if (!password && passwordWajib) errors.password = "Kata sandi wajib diisi.";
  else if (password && password.length < PASSWORD_MIN) errors.password = `Kata sandi minimal ${PASSWORD_MIN} karakter.`;

  if (Object.keys(errors).length > 0) return { data: null, errors };
  return { data: { nama, email, no_hp: noHp, password: password || null }, errors };
}
