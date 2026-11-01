import "server-only";
import { JENIS_TRUK, KAPASITAS_MAX } from "./truk";
import { normalizePlate, type FieldErrors } from "./validation";

export type TrukInput = {
  no_polisi: string;
  jenis_truk: string | null;
  kapasitas_muatan: number | null;
};

/** Membaca dan memvalidasi field teks form truk (foto diperiksa terpisah). */
export function parseTrukForm(form: FormData): { data: TrukInput | null; errors: FieldErrors } {
  const text = (key: string) => {
    const value = form.get(key);
    return typeof value === "string" ? value.trim() : "";
  };
  const errors: FieldErrors = {};

  const platInput = text("no_polisi");
  const noPolisi = normalizePlate(platInput);
  if (!platInput) errors.no_polisi = "Nomor plat truk wajib diisi.";
  else if (!noPolisi) errors.no_polisi = "Format nomor plat tidak dikenali. Contoh: B 9123 KXT.";

  const jenis = text("jenis_truk");
  if (jenis && !(JENIS_TRUK as readonly string[]).includes(jenis)) errors.jenis_truk = "Pilih jenis truk dari daftar.";

  const kapasitasInput = text("kapasitas_muatan").replace(/\./g, "");
  let kapasitas: number | null = null;
  if (kapasitasInput) {
    kapasitas = Number(kapasitasInput);
    if (!Number.isInteger(kapasitas) || kapasitas <= 0 || kapasitas > KAPASITAS_MAX) {
      errors.kapasitas_muatan = `Kapasitas muatan berupa angka bulat 1 sampai ${KAPASITAS_MAX.toLocaleString("id-ID")} kg.`;
    }
  }

  if (Object.keys(errors).length > 0 || !noPolisi) return { data: null, errors };
  return { data: { no_polisi: noPolisi, jenis_truk: jenis || null, kapasitas_muatan: kapasitas }, errors };
}
