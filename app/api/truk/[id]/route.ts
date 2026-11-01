import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { parseId, serverError } from "@/lib/api";
import { requireApiRole } from "@/lib/auth";
import { getTrukMilik } from "@/lib/data/truk";
import { db, isDuplicateError } from "@/lib/db";
import { parseTrukForm } from "@/lib/truk-input";
import { checkTruckPhoto, deleteTruckPhoto, saveTruckPhoto } from "@/lib/upload";

type Context = RouteContext<"/api/truk/[id]">;

const notFound = () => NextResponse.json({ message: "Data truk tidak ditemukan." }, { status: 404 });

/** Ubah truk milik sopir. Foto boleh tidak dikirim; bila dikirim, foto lama diganti. */
export async function PATCH(request: Request, { params }: Context) {
  const auth = await requireApiRole("sopir");
  if (auth.response) return auth.response;
  const id = parseId((await params).id);
  if (!id) return notFound();

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ message: "Permintaan tidak valid." }, { status: 400 });
  }

  const lama = await getTrukMilik(id, auth.user.id).catch(() => null);
  if (!lama) return notFound();

  const { data, errors } = parseTrukForm(form);
  const fotoValue = form.get("foto_truk");
  const adaFotoBaru = fotoValue instanceof File && fotoValue.size > 0;
  const photo = adaFotoBaru ? await checkTruckPhoto(fotoValue) : null;
  if (photo && !photo.ok) errors.foto_truk = photo.message;
  if (!data || (photo && !photo.ok)) {
    return NextResponse.json({ message: "Periksa kembali data yang ditandai.", errors }, { status: 400 });
  }

  const fotoBaru = photo?.ok ? await saveTruckPhoto(photo.bytes, photo.ext) : null;
  try {
    await db.execute(
      `UPDATE truk SET no_polisi = ?, jenis_truk = ?, kapasitas_muatan = ?, foto_truk = ?
       WHERE id_truk = ? AND id_pengguna = ?`,
      [data.no_polisi, data.jenis_truk, data.kapasitas_muatan, fotoBaru ?? lama.foto_truk, id, auth.user.id],
    );
  } catch (error) {
    await deleteTruckPhoto(fotoBaru);
    if (isDuplicateError(error)) {
      return NextResponse.json(
        { message: "Periksa kembali data yang ditandai.", errors: { no_polisi: "Nomor plat ini sudah terdaftar." } },
        { status: 409 },
      );
    }
    return serverError(error);
  }
  if (fotoBaru) await deleteTruckPhoto(lama.foto_truk);
  return NextResponse.json({ id_truk: id, no_polisi: data.no_polisi });
}

/** Hapus truk. Truk yang sudah pernah dipakai di pemesanan tidak bisa dihapus. */
export async function DELETE(_request: Request, { params }: Context) {
  const auth = await requireApiRole("sopir");
  if (auth.response) return auth.response;
  const id = parseId((await params).id);
  if (!id) return notFound();

  try {
    const lama = await getTrukMilik(id, auth.user.id);
    if (!lama) return notFound();

    const [dipakai] = await db.execute<RowDataPacket[]>("SELECT 1 FROM pemesanan WHERE id_truk = ? LIMIT 1", [id]);
    if (dipakai.length > 0) {
      return NextResponse.json(
        { message: `Truk ${lama.no_polisi} tidak bisa dihapus karena sudah dipakai di pemesanan.` },
        { status: 409 },
      );
    }

    await db.execute("DELETE FROM truk WHERE id_truk = ? AND id_pengguna = ?", [id, auth.user.id]);
    await deleteTruckPhoto(lama.foto_truk);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if ((error as { code?: string }).code === "ER_ROW_IS_REFERENCED_2") {
      return NextResponse.json(
        { message: "Truk tidak bisa dihapus karena sudah dipakai di pemesanan." },
        { status: 409 },
      );
    }
    return serverError(error);
  }
}
