import { toIsoDate } from "./format";

const POLA = /^\d{4}-\d{2}-\d{2}$/;

function tanggalValid(value: string): boolean {
  if (!POLA.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

export type PeriodeLaporan =
  | { ok: true; awal: string; akhir: string }
  | { ok: false; awal: string; akhir: string; errors: { awal?: string; akhir?: string } };

/** Periode bawaan: tanggal 1 bulan ini sampai hari ini. */
export function periodeBawaan(sekarang = new Date()) {
  return { awal: toIsoDate(new Date(sekarang.getFullYear(), sekarang.getMonth(), 1)), akhir: toIsoDate(sekarang) };
}

/** Membaca ?awal=&akhir= dari URL. Kosong berarti periode bawaan. */
export function parsePeriode(awalInput: unknown, akhirInput: unknown): PeriodeLaporan {
  const bawaan = periodeBawaan();
  const awal = typeof awalInput === "string" && awalInput ? awalInput : bawaan.awal;
  const akhir = typeof akhirInput === "string" && akhirInput ? akhirInput : bawaan.akhir;
  const errors: { awal?: string; akhir?: string } = {};
  if (!tanggalValid(awal)) errors.awal = "Tanggal awal tidak valid.";
  if (!tanggalValid(akhir)) errors.akhir = "Tanggal akhir tidak valid.";
  if (!errors.awal && !errors.akhir && awal > akhir) errors.akhir = "Tanggal akhir tidak boleh sebelum tanggal awal.";
  if (errors.awal || errors.akhir) return { ok: false, awal, akhir, errors };
  return { ok: true, awal, akhir };
}
