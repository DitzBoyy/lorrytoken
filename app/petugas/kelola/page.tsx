import type { Metadata } from "next";
import { requirePageRole } from "@/lib/auth";
import { getDaftarDock } from "@/lib/data/petugas";
import { getSlotPerTanggal, getTanggalSlot } from "@/lib/data/slot";
import { KelolaView } from "./kelola-view";

export const metadata: Metadata = { title: "Slot Waktu & Loading Dock" };

export default async function KelolaPage({ searchParams }: PageProps<"/petugas/kelola">) {
  await requirePageRole("petugas");
  const params = await searchParams;
  const daftarTanggal = await getTanggalSlot();
  const diminta = typeof params.tanggal === "string" && /^\d{4}-\d{2}-\d{2}$/.test(params.tanggal) ? params.tanggal : null;
  // Tanggal di luar daftar tetap boleh dibuka (misalnya tanggal baru yang belum punya slot).
  const tanggal = diminta ?? daftarTanggal[0] ?? null;
  const tabs = tanggal && !daftarTanggal.includes(tanggal) ? [...daftarTanggal, tanggal].sort() : daftarTanggal;

  const [slot, dock] = await Promise.all([tanggal ? getSlotPerTanggal(tanggal) : Promise.resolve([]), getDaftarDock()]);

  return <KelolaView key={tanggal ?? "kosong"} daftarTanggal={tabs} tanggal={tanggal} slot={slot} dock={dock} />;
}
