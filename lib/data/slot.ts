import "server-only";
import type { RowDataPacket } from "mysql2";
import { db } from "@/lib/db";

export type SlotKuota = {
  id_slot: number;
  tanggal: string;
  jam_mulai: string;
  jam_selesai: string;
  kuota: number;
  status_slot: "aktif" | "nonaktif";
  /** Pemesanan di slot ini yang statusnya bukan dibatalkan */
  terpakai: number;
  /** kuota dikurangi terpakai, tidak pernah negatif */
  sisa: number;
  /** Slot hari ini yang jam selesainya sudah lewat */
  lewat: boolean;
};

/** SQL sisa kuota: kuota dikurangi pemesanan yang statusnya bukan dibatalkan (CLAUDE.md bagian 6). */
const SLOT_SELECT = `
  SELECT s.id_slot, DATE_FORMAT(s.tanggal, '%Y-%m-%d') AS tanggal, s.jam_mulai, s.jam_selesai,
         s.kuota, s.status_slot,
         CAST(COUNT(p.id_pemesanan) AS UNSIGNED) AS terpakai,
         (s.tanggal < CURDATE() OR (s.tanggal = CURDATE() AND s.jam_selesai <= CURTIME())) AS lewat
  FROM slot_waktu s
  LEFT JOIN pemesanan p ON p.id_slot = s.id_slot AND p.status_pemesanan <> 'dibatalkan'`;

type SlotRow = RowDataPacket & Omit<SlotKuota, "sisa" | "lewat"> & { lewat: number };

function toSlot(row: SlotRow): SlotKuota {
  const terpakai = Number(row.terpakai);
  return {
    id_slot: row.id_slot,
    tanggal: row.tanggal,
    jam_mulai: row.jam_mulai,
    jam_selesai: row.jam_selesai,
    kuota: row.kuota,
    status_slot: row.status_slot,
    terpakai,
    sisa: Math.max(0, row.kuota - terpakai),
    lewat: Boolean(Number(row.lewat)),
  };
}

export async function getSlotPerTanggal(tanggal: string): Promise<SlotKuota[]> {
  const [rows] = await db.execute<SlotRow[]>(
    `${SLOT_SELECT} WHERE s.tanggal = ? GROUP BY s.id_slot ORDER BY s.jam_mulai`,
    [tanggal],
  );
  return rows.map(toSlot);
}

/** Tanggal mulai hari ini yang punya slot aktif, untuk tab tanggal di halaman pemesanan. */
export async function getTanggalTersedia(limit = 7): Promise<string[]> {
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT DISTINCT DATE_FORMAT(tanggal, '%Y-%m-%d') AS tanggal FROM slot_waktu
     WHERE tanggal >= CURDATE() AND status_slot = 'aktif'
     ORDER BY tanggal LIMIT ?`,
    [limit],
  );
  return rows.map((row) => row.tanggal as string);
}
