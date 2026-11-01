import type { Metadata } from "next";
import { requirePageRole } from "@/lib/auth";
import { getStatusSopir } from "@/lib/data/pemesanan";
import { StatusAntrianView } from "./status-view";

export const metadata: Metadata = { title: "Status Antrian" };

export default async function StatusAntrianPage({ searchParams }: PageProps<"/sopir/status">) {
  const user = await requirePageRole("sopir");
  const params = await searchParams;
  const kode = typeof params.kode === "string" ? params.kode : null;
  const status = await getStatusSopir(user.id, kode);
  return <StatusAntrianView key={kode ?? "otomatis"} initial={status} kode={kode} />;
}
