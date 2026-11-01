"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { PasswordField } from "@/components/ui/password-field";
import { Notice } from "@/components/ui/notice";
import type { FieldErrors } from "@/lib/validation";

export function LoginForm({ registered, defaultEmail }: { registered: boolean; defaultEmail: string }) {
  const router = useRouter();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");

    const nextErrors: FieldErrors = {};
    if (!email) nextErrors.email = "Email wajib diisi.";
    if (!password) nextErrors.password = "Kata sandi wajib diisi.";
    setErrors(nextErrors);
    if (nextErrors.email || nextErrors.password) {
      setMessage(null);
      (nextErrors.email ? emailRef : passwordRef).current?.focus();
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setErrors(result.errors ?? {});
        setMessage(result.message ?? "Login gagal. Coba lagi.");
        setLoading(false);
        return;
      }
      router.replace(result.redirectTo);
      router.refresh();
    } catch {
      setMessage("Tidak dapat terhubung ke server. Periksa koneksi lalu coba lagi.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {registered && !message && (
        <Notice tone="success">Akun berhasil dibuat. Silakan masuk dengan email dan kata sandi Anda.</Notice>
      )}
      {message && <Notice tone="error">{message}</Notice>}

      <TextField
        ref={emailRef}
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        defaultValue={defaultEmail}
        error={errors.email}
        required
      />
      <PasswordField
        ref={passwordRef}
        label="Kata sandi"
        name="password"
        autoComplete="current-password"
        error={errors.password}
        required
      />
      <Button type="submit" fullWidth loading={loading} loadingText="Memeriksa" className="mt-2 h-[3.25rem] text-base">
        Masuk
      </Button>
    </form>
  );
}
