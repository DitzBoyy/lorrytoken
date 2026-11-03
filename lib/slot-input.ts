import "server-only";
import type { FieldErrors } from "./validation";

export type SlotInput = {
  tanggal: string;
  jam_mulai: string;
  jam_selesai: string;
  kuota: number;
  status_slot: "aktif" | "nonaktif";
};

const TIME = /^([01]\d|2[0-3])[:.]([0-5]\d)$/;

/** Validasi field slot waktu. Jam diterima "07:00" atau "07.00" dan disimpan sebagai "07:00:00". */
export function parseSlotBody(body: Record<string, unknown>): { data: SlotInput | null; errors: FieldErrors } {
  const text = (key: string) => (typeof body[key] === "string" ? (body[key] as string).trim() : "");
  const errors: FieldErrors = {};

  const tanggal = text("tanggal");
  if (!tanggal) errors.tanggal = "Tanggal wajib diisi.";
  else if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggal) || Number.isNaN(Date.parse(tanggal))) errors.tanggal = "Format tanggal tidak valid.";

  const mulai = text("jam_mulai").match(TIME);
  const selesai = text("jam_selesai").match(TIME);
  if (!text("jam_mulai")) errors.jam_mulai = "Jam mulai wajib diisi.";
  else if (!mulai) errors.jam_mulai = "Format jam tidak valid. Contoh: 07.00";
  if (!text("jam_selesai")) errors.jam_selesai = "Jam selesai wajib diisi.";
  else if (!selesai) errors.jam_selesai = "Format jam tidak valid. Contoh: 08.00";

  const jamMulai = mulai ? `${mulai[1]}:${mulai[2]}:00` : "";
  const jamSelesai = selesai ? `${selesai[1]}:${selesai[2]}:00` : "";
  if (mulai && selesai && jamSelesai <= jamMulai) errors.jam_selesai = "Jam selesai harus setelah jam mulai.";

  const kuotaText = text("kuota") || (typeof body.kuota === "number" ? String(body.kuota) : "");
  const kuota = Number(kuotaText);
  if (!kuotaText) errors.kuota = "Kuota wajib diisi.";
  else if (!Number.isInteger(kuota) || kuota < 0 || kuota > 999) errors.kuota = "Kuota berupa angka bulat 0 sampai 999.";

  const status = text("status_slot") || "aktif";
  if (status !== "aktif" && status !== "nonaktif") errors.status_slot = "Status slot tidak valid.";

  if (Object.keys(errors).length > 0) return { data: null, errors };
  return {
    data: { tanggal, jam_mulai: jamMulai, jam_selesai: jamSelesai, kuota, status_slot: status as SlotInput["status_slot"] },
    errors,
  };
}
