"use client";

import { useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { SelectField, TextField } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { PhotoPicker } from "@/components/ui/photo-picker";
import { JENIS_TRUK, KAPASITAS_MAX, type Truk } from "@/lib/truk";
import { normalizePlate, type FieldErrors } from "@/lib/validation";

/** Form tambah truk, atau ubah truk bila `truk` diisi. */
export function TrukForm({
  truk,
  onSaved,
  onCancel,
}: {
  truk: Truk | null;
  onSaved: (noPolisi: string) => void;
  onCancel: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const modeUbah = truk !== null;

  function focusFirst(found: FieldErrors) {
    const first = ["no_polisi", "jenis_truk", "kapasitas_muatan", "foto_truk"].find((key) => found[key]);
    if (first) formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const found: FieldErrors = {};
    const plat = String(data.get("no_polisi") ?? "").trim();
    if (!plat) found.no_polisi = "Nomor plat truk wajib diisi.";
    else if (!normalizePlate(plat)) found.no_polisi = "Format nomor plat tidak dikenali. Contoh: B 9123 KXT.";
    const kapasitas = String(data.get("kapasitas_muatan") ?? "").replace(/\./g, "").trim();
    if (kapasitas && !(Number.isInteger(Number(kapasitas)) && Number(kapasitas) > 0 && Number(kapasitas) <= KAPASITAS_MAX)) {
      found.kapasitas_muatan = `Kapasitas muatan berupa angka bulat 1 sampai ${KAPASITAS_MAX.toLocaleString("id-ID")} kg.`;
    }
    const foto = data.get("foto_truk");
    if (photoError) found.foto_truk = photoError;
    else if (!modeUbah && (!(foto instanceof File) || foto.size === 0)) found.foto_truk = "Foto truk wajib diunggah.";

    setErrors(found);
    if (Object.keys(found).length > 0) {
      setMessage(null);
      focusFirst(found);
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch(modeUbah ? `/api/truk/${truk.id_truk}` : "/api/truk", {
        method: modeUbah ? "PATCH" : "POST",
        body: data,
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        const serverErrors: FieldErrors = result.errors ?? {};
        setErrors(serverErrors);
        setMessage(result.message ?? "Data truk gagal disimpan. Coba lagi.");
        focusFirst(serverErrors);
        setLoading(false);
        return;
      }
      onSaved(result.no_polisi);
    } catch {
      setMessage("Tidak dapat terhubung ke server. Coba lagi.");
      setLoading(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {message && <Notice tone="error">{message}</Notice>}

      <TextField
        label="Nomor plat truk"
        name="no_polisi"
        defaultValue={truk?.no_polisi}
        autoCapitalize="characters"
        autoComplete="off"
        maxLength={15}
        hint="Contoh: B 9123 KXT"
        error={errors.no_polisi}
        className="uppercase"
        required
      />
      <SelectField label="Jenis truk" name="jenis_truk" defaultValue={truk?.jenis_truk ?? ""} error={errors.jenis_truk}>
        <option value="">Belum diisi</option>
        {JENIS_TRUK.map((jenis) => (
          <option key={jenis} value={jenis}>
            {jenis}
          </option>
        ))}
      </SelectField>
      <TextField
        label="Kapasitas muatan (kg)"
        name="kapasitas_muatan"
        inputMode="numeric"
        pattern="[0-9]*"
        defaultValue={truk?.kapasitas_muatan ?? ""}
        hint="Boleh dikosongkan dan dilengkapi nanti."
        error={errors.kapasitas_muatan}
      />
      <PhotoPicker
        name="foto_truk"
        required={!modeUbah}
        currentSrc={truk?.foto_truk}
        error={errors.foto_truk}
        onValidityChange={(value) => {
          setPhotoError(value);
          setErrors((current) => ({ ...current, foto_truk: value ?? undefined }));
        }}
      />

      <div className="mt-1 flex flex-col gap-3">
        <Button type="submit" fullWidth loading={loading} loadingText="Menyimpan" className="h-[3.25rem] text-base">
          {modeUbah ? "Simpan perubahan" : "Simpan truk"}
        </Button>
        {modeUbah && (
          <Button variant="secondary" fullWidth onClick={onCancel} disabled={loading}>
            Batal ubah
          </Button>
        )}
      </div>
      <p className="text-[0.9375rem] leading-relaxed text-muted">
        Satu nomor plat hanya dapat didaftarkan satu kali. Truk pertama sudah terdaftar saat registrasi akun.
      </p>
    </form>
  );
}
