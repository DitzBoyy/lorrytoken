import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { db, isConnectionError, isDuplicateError, withTransaction } from "@/lib/db";
import { checkTruckPhoto, deleteTruckPhoto, saveTruckPhoto } from "@/lib/upload";
import {
  EMAIL_PATTERN,
  isValidPhone,
  normalizeEmail,
  normalizePhone,
  normalizePlate,
  PASSWORD_MIN,
  type FieldErrors,
} from "@/lib/validation";

/**
 * Registrasi sopir. Role selalu "sopir": form tidak punya pilihan role dan nilai role
 * dari request diabaikan. Baris pengguna dan truk pertama dibuat dalam satu transaksi.
 */
export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ message: "Permintaan tidak valid." }, { status: 400 });
  }

  const text = (key: string) => {
    const value = form.get(key);
    return typeof value === "string" ? value.trim() : "";
  };

  const nama = text("nama").replace(/\s+/g, " ");
  const email = normalizeEmail(text("email"));
  const noHp = normalizePhone(text("no_hp"));
  const password = typeof form.get("password") === "string" ? (form.get("password") as string) : "";
  const platInput = text("no_polisi");
  const noPolisi = normalizePlate(platInput);
  const fotoValue = form.get("foto_truk");
  const foto = fotoValue instanceof File ? fotoValue : null;

  const errors: FieldErrors = {};
  if (!nama) errors.nama = "Nama lengkap wajib diisi.";
  else if (nama.length > 100) errors.nama = "Nama lengkap maksimal 100 karakter.";

  if (!email) errors.email = "Email wajib diisi.";
  else if (!EMAIL_PATTERN.test(email) || email.length > 100) errors.email = "Format email tidak valid.";

  if (!text("no_hp")) errors.no_hp = "Nomor HP wajib diisi.";
  else if (!isValidPhone(noHp)) errors.no_hp = "Nomor HP diawali 0 dan berisi 9 sampai 15 angka.";

  if (!password) errors.password = "Kata sandi wajib diisi.";
  else if (password.length < PASSWORD_MIN) errors.password = `Kata sandi minimal ${PASSWORD_MIN} karakter.`;

  if (!platInput) errors.no_polisi = "Nomor plat truk wajib diisi.";
  else if (!noPolisi) errors.no_polisi = "Format nomor plat tidak dikenali. Contoh: B 9123 KXT.";

  const photo = await checkTruckPhoto(foto);
  if (!photo.ok) errors.foto_truk = photo.message;

  if (Object.keys(errors).length > 0 || !photo.ok || !noPolisi) {
    return NextResponse.json({ message: "Periksa kembali data yang ditandai.", errors }, { status: 400 });
  }

  try {
    // Pemeriksaan awal agar pesan per kolom jelas. UNIQUE di database tetap menjadi penjaga terakhir.
    const [dupes] = await db.execute<RowDataPacket[]>(
      `SELECT 'email' AS kolom FROM pengguna WHERE email = ?
       UNION ALL SELECT 'no_polisi' FROM truk WHERE no_polisi = ?`,
      [email, noPolisi],
    );
    for (const row of dupes) {
      if (row.kolom === "email") errors.email = "Email sudah terdaftar. Silakan masuk.";
      if (row.kolom === "no_polisi") errors.no_polisi = "Nomor plat ini sudah terdaftar.";
    }
    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ message: "Periksa kembali data yang ditandai.", errors }, { status: 409 });
    }
  } catch (error) {
    return serverError(error);
  }

  const hash = await bcrypt.hash(password, 10);
  const fotoPath = await saveTruckPhoto(photo.bytes, photo.ext);

  try {
    await withTransaction(async (conn) => {
      const [userResult] = await conn.execute<ResultSetHeader>(
        "INSERT INTO pengguna (nama, email, no_hp, password, role) VALUES (?, ?, ?, ?, 'sopir')",
        [nama, email, noHp, hash],
      );
      await conn.execute(
        "INSERT INTO truk (id_pengguna, no_polisi, jenis_truk, kapasitas_muatan, foto_truk) VALUES (?, ?, NULL, NULL, ?)",
        [userResult.insertId, noPolisi, fotoPath],
      );
    });
  } catch (error) {
    await deleteTruckPhoto(fotoPath);
    if (isDuplicateError(error)) {
      const field = error.sqlMessage?.includes("no_polisi") ? "no_polisi" : "email";
      const message = field === "email" ? "Email sudah terdaftar. Silakan masuk." : "Nomor plat ini sudah terdaftar.";
      return NextResponse.json({ message: "Periksa kembali data yang ditandai.", errors: { [field]: message } }, { status: 409 });
    }
    return serverError(error);
  }

  return NextResponse.json({ email }, { status: 201 });
}

function serverError(error: unknown) {
  console.error("Registrasi gagal:", error);
  const message = isConnectionError(error)
    ? "Server tidak dapat terhubung ke database. Coba lagi nanti."
    : "Terjadi kesalahan pada server. Coba lagi.";
  return NextResponse.json({ message }, { status: 500 });
}
