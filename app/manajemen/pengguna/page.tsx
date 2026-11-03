import type { Metadata } from "next";
import { requirePageRole } from "@/lib/auth";
import { getDaftarPetugas } from "@/lib/data/manajemen";
import { PenggunaView } from "./pengguna-view";

export const metadata: Metadata = { title: "Data Pengguna" };

export default async function PenggunaPage() {
  await requirePageRole("manajemen");
  const petugas = await getDaftarPetugas();
  return <PenggunaView petugas={petugas} />;
}
