import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { PHOTO_MAX_BYTES } from "./validation";

/** Folder fisik foto truk. Database hanya menyimpan path publiknya, misalnya /uploads/truk/abc.jpg */
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "truk");
const PUBLIC_PREFIX = "/uploads/truk/";

export type PhotoCheck = { ok: true; ext: "jpg" | "png"; bytes: Buffer } | { ok: false; message: string };

/**
 * Memeriksa foto dari isi file (signature JPG atau PNG), bukan dari nama atau tipe yang dikirim browser.
 */
export async function checkTruckPhoto(file: File | null): Promise<PhotoCheck> {
  if (!file || file.size === 0) return { ok: false, message: "Foto truk wajib diunggah." };
  if (file.size > PHOTO_MAX_BYTES) return { ok: false, message: "Ukuran foto maksimal 2 MB." };

  const bytes = Buffer.from(await file.arrayBuffer());
  const isJpg = bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isPng =
    bytes.length > 8 &&
    bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (!isJpg && !isPng) return { ok: false, message: "Foto harus berformat JPG atau PNG." };

  return { ok: true, ext: isJpg ? "jpg" : "png", bytes };
}

/** Menyimpan foto ke public/uploads/truk dan mengembalikan path publiknya. */
export async function saveTruckPhoto(bytes: Buffer, ext: "jpg" | "png"): Promise<string> {
  await mkdir(UPLOAD_DIR, { recursive: true });
  const fileName = `${randomUUID()}.${ext}`;
  await writeFile(path.join(UPLOAD_DIR, fileName), bytes);
  return `${PUBLIC_PREFIX}${fileName}`;
}

/** Menghapus foto berdasarkan path publiknya. Diam saja bila file sudah tidak ada. */
export async function deleteTruckPhoto(publicPath: string | null | undefined): Promise<void> {
  if (!publicPath?.startsWith(PUBLIC_PREFIX)) return;
  const fileName = path.basename(publicPath);
  try {
    await unlink(path.join(UPLOAD_DIR, fileName));
  } catch {
    // file sudah tidak ada
  }
}
