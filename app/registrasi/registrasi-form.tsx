"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { PasswordField } from "@/components/ui/password-field";
import { Notice } from "@/components/ui/notice";
import { PhotoPicker } from "@/components/ui/photo-picker";
import {
  EMAIL_PATTERN,
  isValidPhone,
  normalizePhone,
  normalizePlate,
  PASSWORD_MIN,
  type FieldErrors,
} from "@/lib/validation";

const FIELD_ORDER = ["nama", "email", "no_hp", "password", "no_polisi", "foto_truk"] as const;

/** Pemeriksaan di browser. Server memeriksa ulang dengan aturan yang sama. */
function validate(data: FormData, photoError: string | null): FieldErrors {
  const get = (key: string) => String(data.get(key) ?? "").trim();
  const errors: FieldErrors = {};

  if (!get("nama")) errors.nama = "Nama lengkap wajib diisi.";
  const email = get("email");
  if (!email) errors.email = "Email wajib diisi.";
  else if (!EMAIL_PATTERN.test(email)) errors.email = "Format email tidak valid.";
  const hp = get("no_hp");
  if (!hp) errors.no_hp = "Nomor HP wajib diisi.";
  else if (!isValidPhone(normalizePhone(hp))) errors.no_hp = "Nomor HP diawali 0 dan berisi 9 sampai 15 angka.";
  const password = String(data.get("password") ?? "");
  if (!password) errors.password = "Kata sandi wajib diisi.";
  else if (password.length < PASSWORD_MIN) errors.password = `Kata sandi minimal ${PASSWORD_MIN} karakter.`;
  const plat = get("no_polisi");
  if (!plat) errors.no_polisi = "Nomor plat truk wajib diisi.";
  else if (!normalizePlate(plat)) errors.no_polisi = "Format nomor plat tidak dikenali. Contoh: B 9123 KXT.";
  const foto = data.get("foto_truk");
  if (photoError) errors.foto_truk = photoError;
  else if (!(foto instanceof File) || foto.size === 0) errors.foto_truk = "Foto truk wajib diunggah.";

  return errors;
}

export function RegistrasiForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function focusFirstError(found: FieldErrors) {
    const first = FIELD_ORDER.find((key) => found[key]);
    if (first) formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const found = validate(data, photoError);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setMessage("Periksa kembali data yang ditandai.");
      focusFirstError(found);
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/auth/registrasi", { method: "POST", body: data });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        const serverErrors: FieldErrors = result.errors ?? {};
        setErrors(serverErrors);
        setMessage(result.message ?? "Pendaftaran gagal. Coba lagi.");
        focusFirstError(serverErrors);
        setLoading(false);
        return;
      }
      router.push(`/login?terdaftar=1&email=${encodeURIComponent(result.email)}`);
    } catch {
      setMessage("Tidak dapat terhubung ke server. Periksa koneksi lalu coba lagi.");
      setLoading(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {message && <Notice tone="error">{message}</Notice>}

      <TextField label="Nama lengkap" name="nama" autoComplete="name" maxLength={100} error={errors.nama} required />
      <TextField
        label="Email"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        maxLength={100}
        error={errors.email}
        required
      />
      <TextField
        label="Nomor HP"
        name="no_hp"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        maxLength={20}
        error={errors.no_hp}
        required
      />
      <PasswordField
        label="Kata sandi"
        name="password"
        autoComplete="new-password"
        hint={`Minimal ${PASSWORD_MIN} karakter.`}
        error={errors.password}
        required
      />

      <section aria-labelledby="judul-data-truk" className="mt-2 flex flex-col gap-5 border-t border-line pt-7">
        <h2 id="judul-data-truk" className="-mt-1 font-display text-[1.5rem] leading-tight font-bold">
          Data truk
        </h2>
        <TextField
          label="Nomor plat truk"
          name="no_polisi"
          autoCapitalize="characters"
          autoComplete="off"
          maxLength={15}
          hint="Contoh: B 9123 KXT"
          error={errors.no_polisi}
          className="uppercase"
          required
        />
        <PhotoPicker
          name="foto_truk"
          required
          error={errors.foto_truk}
          onValidityChange={(value) => {
            setPhotoError(value);
            setErrors((current) => ({ ...current, foto_truk: value ?? undefined }));
          }}
        />
      </section>

      <Button type="submit" fullWidth loading={loading} loadingText="Mendaftarkan" className="mt-2 h-[3.25rem] text-base">
        Buat akun
      </Button>
    </form>
  );
}
