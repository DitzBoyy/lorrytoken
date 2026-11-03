import "server-only";
import type { FieldErrors } from "./validation";

export type DockInput = {
  nama_dock: string;
  /** Petugas hanya bisa memilih tersedia atau nonaktif. "digunakan" diatur oleh alokasi antrian. */
  status_dock: "tersedia" | "nonaktif";
  keterangan: string | null;
};

export function parseDockBody(body: Record<string, unknown>): { data: DockInput | null; errors: FieldErrors } {
  const text = (key: string) => (typeof body[key] === "string" ? (body[key] as string).trim() : "");
  const errors: FieldErrors = {};

  const nama = text("nama_dock").replace(/\s+/g, " ");
  if (!nama) errors.nama_dock = "Nama dock wajib diisi.";
  else if (nama.length > 50) errors.nama_dock = "Nama dock maksimal 50 karakter.";

  const status = text("status_dock") || "tersedia";
  if (status !== "tersedia" && status !== "nonaktif") errors.status_dock = "Status dock hanya tersedia atau nonaktif.";

  const keterangan = text("keterangan");
  if (keterangan.length > 500) errors.keterangan = "Keterangan maksimal 500 karakter.";

  if (Object.keys(errors).length > 0) return { data: null, errors };
  return {
    data: { nama_dock: nama, status_dock: status as DockInput["status_dock"], keterangan: keterangan || null },
    errors,
  };
}
