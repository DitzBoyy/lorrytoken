/** Aturan data truk yang dipakai bersama oleh form dan API. */

export const JENIS_TRUK = ["Pick-up", "Engkel box", "Double engkel", "Wingbox", "Tronton", "Trailer"] as const;

export const KAPASITAS_MAX = 100_000; // kg

export type Truk = {
  id_truk: number;
  no_polisi: string;
  jenis_truk: string | null;
  kapasitas_muatan: number | null;
  foto_truk: string | null;
};

/** Label truk di pilihan: "B 9123 KXT · Wingbox" */
export function labelTruk(truk: Pick<Truk, "no_polisi" | "jenis_truk">): string {
  return truk.jenis_truk ? `${truk.no_polisi} · ${truk.jenis_truk}` : truk.no_polisi;
}
