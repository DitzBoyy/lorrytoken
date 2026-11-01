import { AppShell } from "@/components/layout/app-shell";
import { requirePageRole } from "@/lib/auth";

export default async function Layout({ children }: LayoutProps<"/petugas">) {
  // proxy.ts sudah menyaring lebih dulu; pemeriksaan ini memastikan akun masih ada di database.
  const user = await requirePageRole("petugas");
  return <AppShell user={{ nama: user.nama, role: user.role }}>{children}</AppShell>;
}
