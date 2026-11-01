/** Aturan dan normalisasi input yang dipakai bersama oleh form (klien) dan API (server). */

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PASSWORD_MIN = 8;

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

/** Nomor HP disimpan sebagai angka saja, misalnya "0812 3456 7890" menjadi "081234567890". */
export function normalizePhone(value: string): string {
  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, "");
  // +62 812... disimpan sebagai 0812...
  if (trimmed.startsWith("+62")) return `0${digits.slice(2)}`;
  return digits;
}

export function isValidPhone(normalized: string): boolean {
  return /^0\d{8,14}$/.test(normalized);
}

/**
 * Nomor plat dinormalkan ke format "B 9123 KXT": kode wilayah, nomor, dan huruf seri dipisah satu spasi.
 * Mengembalikan null bila formatnya bukan nomor plat Indonesia.
 */
export function normalizePlate(value: string): string | null {
  const compact = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const match = compact.match(/^([A-Z]{1,2})(\d{1,4})([A-Z]{0,3})$/);
  if (!match) return null;
  return [match[1], match[2], match[3]].filter(Boolean).join(" ");
}

export const PHOTO_MAX_BYTES = 2 * 1024 * 1024;
export const PHOTO_TYPES = ["image/jpeg", "image/png"] as const;

export type FieldErrors = Partial<Record<string, string>>;
