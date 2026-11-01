import type { Metadata } from "next";
import Link from "next/link";
import { AuthHeading, AuthLayout } from "@/components/auth/auth-layout";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Masuk" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const registered = params.terdaftar === "1";
  const email = typeof params.email === "string" ? params.email : "";

  return (
    <AuthLayout>
      <AuthHeading title="Masuk" description="Gunakan akun yang sudah terdaftar." />
      <LoginForm registered={registered} defaultEmail={email} />
      <p className="mt-6 text-[0.9375rem] text-muted">
        Belum punya akun sopir?{" "}
        <Link href="/registrasi" className="font-bold text-ink underline-offset-4 hover:underline">
          Daftar di sini
        </Link>
      </p>
    </AuthLayout>
  );
}
