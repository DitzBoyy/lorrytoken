import { cn } from "@/lib/cn";

/**
 * Semua nilai status di database (huruf kecil) dipetakan ke satu nada warna.
 * Menunggu, dimuat, selesai, dipesan, nonaktif, dan error mengikuti CLAUDE.md bagian 7.
 * Nilai lain dipetakan ke nada yang paling dekat maknanya.
 */
export type StatusValue =
  // pemesanan
  | "dipesan"
  | "check-in"
  | "dibatalkan"
  | "tidak hadir"
  // antrian
  | "menunggu"
  | "dimuat"
  | "selesai"
  // loading dock
  | "tersedia"
  | "digunakan"
  | "nonaktif"
  // slot waktu
  | "aktif";

type Tone = "menunggu" | "dimuat" | "selesai" | "netral" | "error";

const toneOf: Record<StatusValue, Tone> = {
  dipesan: "netral",
  "check-in": "selesai",
  dibatalkan: "netral",
  "tidak hadir": "error",
  menunggu: "menunggu",
  dimuat: "dimuat",
  selesai: "selesai",
  tersedia: "selesai",
  digunakan: "dimuat",
  nonaktif: "netral",
  aktif: "selesai",
};

const toneClass: Record<Tone, string> = {
  menunggu: "bg-menunggu-bg text-menunggu",
  dimuat: "bg-dimuat-bg text-dimuat",
  selesai: "bg-selesai-bg text-selesai",
  netral: "bg-netral-bg text-netral",
  error: "bg-error-bg text-error",
};

const labelOf: Record<StatusValue, string> = {
  dipesan: "Dipesan",
  "check-in": "Check-in",
  dibatalkan: "Dibatalkan",
  "tidak hadir": "Tidak hadir",
  menunggu: "Menunggu",
  dimuat: "Dimuat",
  selesai: "Selesai",
  tersedia: "Tersedia",
  digunakan: "Digunakan",
  nonaktif: "Nonaktif",
  aktif: "Aktif",
};

export function statusTone(status: StatusValue): Tone {
  return toneOf[status] ?? "netral";
}

export function StatusTag({
  status,
  label,
  className,
}: {
  status: StatusValue;
  /** Ganti teks hanya bila konteks benar-benar butuh label lain. Label bawaan sama dengan nilai di database. */
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-7 flex-none items-center whitespace-nowrap rounded-sm px-2.5 text-sm font-semibold",
        "transition-colors duration-150",
        toneClass[statusTone(status)],
        className,
      )}
    >
      {label ?? labelOf[status] ?? status}
    </span>
  );
}
