import type { Metadata } from "next";
import Link from "next/link";
import { AuthHeading, AuthLayout } from "@/components/auth/auth-layout";
import { RegistrasiForm } from "./registrasi-form";

export const metadata: Metadata = { title: "Daftar akun sopir" };

export default function RegistrasiPage() {
  return (
    <AuthLayout>
      <AuthHeading title="Daftar akun sopir" description="Akun ini dipakai untuk memesan slot waktu muat." />
      <RegistrasiForm />
      <p className="mt-6 text-[0.9375rem] text-muted">
        Sudah punya akun?{" "}
        <Link href="/login" className="font-bold text-ink underline-offset-4 hover:underline">
          Masuk
        </Link>
      </p>
    </AuthLayout>
  );
}
