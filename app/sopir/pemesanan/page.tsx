import type { Metadata } from "next";
import { requirePageRole } from "@/lib/auth";
import { getSlotPerTanggal, getTanggalTersedia } from "@/lib/data/slot";
import { getTrukSopir } from "@/lib/data/truk";
import { PemesananView } from "./pemesanan-view";

export const metadata: Metadata = { title: "Pemesanan Slot Waktu" };

export default async function PemesananPage({ searchParams }: PageProps<"/sopir/pemesanan">) {
  const user = await requirePageRole("sopir");
  const params = await searchParams;
  const daftarTanggal = await getTanggalTersedia();
  const diminta = typeof params.tanggal === "string" ? params.tanggal : null;
  const tanggal = diminta && daftarTanggal.includes(diminta) ? diminta : (daftarTanggal[0] ?? null);

  const [slot, truk] = await Promise.all([tanggal ? getSlotPerTanggal(tanggal) : Promise.resolve([]), getTrukSopir(user.id)]);

  return (
    <PemesananView
      key={tanggal ?? "kosong"}
      daftarTanggal={daftarTanggal}
      tanggal={tanggal}
      // Slot nonaktif (misalnya jam istirahat) tidak ditampilkan, seperti di mockup.
      slot={slot.filter((item) => item.status_slot === "aktif")}
      truk={truk}
    />
  );
}
