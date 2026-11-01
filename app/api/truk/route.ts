import { NextResponse } from "next/server";
import type { ResultSetHeader } from "mysql2";
import { requireApiRole } from "@/lib/auth";
import { getTrukSopir } from "@/lib/data/truk";
import { db, isDuplicateError } from "@/lib/db";
import { serverError } from "@/lib/api";
import { parseTrukForm } from "@/lib/truk-input";
import { checkTruckPhoto, deleteTruckPhoto, saveTruckPhoto } from "@/lib/upload";

/** Daftar truk milik sopir yang login. */
export async function GET() {
  const auth = await requireApiRole("sopir");
  if (auth.response) return auth.response;
  try {
    return NextResponse.json({ truk: await getTrukSopir(auth.user.id) });
  } catch (error) {
    return serverError(error);
  }
}

/** Tambah truk. Foto wajib agar petugas bisa mencocokkan truk saat verifikasi. */
export async function POST(request: Request) {
  const auth = await requireApiRole("sopir");
  if (auth.response) return auth.response;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ message: "Permintaan tidak valid." }, { status: 400 });
  }

  const { data, errors } = parseTrukForm(form);
  const fotoValue = form.get("foto_truk");
  const photo = await checkTruckPhoto(fotoValue instanceof File ? fotoValue : null);
  if (!photo.ok) errors.foto_truk = photo.message;
  if (!data || !photo.ok) {
    return NextResponse.json({ message: "Periksa kembali data yang ditandai.", errors }, { status: 400 });
  }

  const fotoPath = await saveTruckPhoto(photo.bytes, photo.ext);
  try {
    const [result] = await db.execute<ResultSetHeader>(
      `INSERT INTO truk (id_pengguna, no_polisi, jenis_truk, kapasitas_muatan, foto_truk) VALUES (?, ?, ?, ?, ?)`,
      [auth.user.id, data.no_polisi, data.jenis_truk, data.kapasitas_muatan, fotoPath],
    );
    return NextResponse.json({ id_truk: result.insertId, no_polisi: data.no_polisi }, { status: 201 });
  } catch (error) {
    await deleteTruckPhoto(fotoPath);
    if (isDuplicateError(error)) {
      return NextResponse.json(
        { message: "Periksa kembali data yang ditandai.", errors: { no_polisi: "Nomor plat ini sudah terdaftar." } },
        { status: 409 },
      );
    }
    return serverError(error);
  }
}
