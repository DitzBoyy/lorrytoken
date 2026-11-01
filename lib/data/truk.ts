import "server-only";
import type { RowDataPacket } from "mysql2";
import { db } from "@/lib/db";
import type { Truk } from "@/lib/truk";

export async function getTrukSopir(idPengguna: number): Promise<Truk[]> {
  const [rows] = await db.execute<(RowDataPacket & Truk)[]>(
    `SELECT id_truk, no_polisi, jenis_truk, kapasitas_muatan, foto_truk
     FROM truk WHERE id_pengguna = ? ORDER BY id_truk`,
    [idPengguna],
  );
  return rows.map((row) => ({ ...row }));
}

export async function getTrukMilik(idTruk: number, idPengguna: number): Promise<Truk | null> {
  const [rows] = await db.execute<(RowDataPacket & Truk)[]>(
    `SELECT id_truk, no_polisi, jenis_truk, kapasitas_muatan, foto_truk
     FROM truk WHERE id_truk = ? AND id_pengguna = ? LIMIT 1`,
    [idTruk, idPengguna],
  );
  return rows[0] ? { ...rows[0] } : null;
}
