import type { Metadata } from "next";
import { requirePageRole } from "@/lib/auth";
import { nomorAntrianBerikutnya } from "@/lib/data/petugas";
import { VerifikasiView } from "./verifikasi-view";

export const metadata: Metadata = { title: "Verifikasi Kedatangan" };

export default async function VerifikasiPage() {
  await requirePageRole("petugas");
  const nomorBerikutnya = await nomorAntrianBerikutnya();
  return <VerifikasiView nomorAwal={nomorBerikutnya} />;
}
