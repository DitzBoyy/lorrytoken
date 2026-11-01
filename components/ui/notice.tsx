import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Nada pesan. "menunggu" dan "dimuat" memakai pasangan warna status yang sama dengan tag status
 * (CLAUDE.md bagian 7), jadi hanya dipakai untuk pesan tentang status itu. Pesan umum memakai "info".
 */
type Tone = "info" | "menunggu" | "dimuat" | "success" | "error" | "neutral";

const tones: Record<Tone, string> = {
  info: "border-l-4 border-steel bg-subtle text-ink",
  menunggu: "bg-menunggu-bg text-ink",
  dimuat: "bg-dimuat-bg text-ink",
  success: "bg-selesai-bg text-ink",
  error: "bg-error-bg text-error",
  neutral: "bg-subtle text-steel",
};

/**
 * Pesan di dalam area kerja. Pesan error memakai role="alert" agar dibacakan pembaca layar,
 * yang lain role="status".
 */
export function Notice({
  tone = "info",
  children,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn("rounded-sm px-5 py-4 text-[0.9375rem] leading-relaxed", tones[tone], className)}
    >
      {children}
    </div>
  );
}

/** Keadaan kosong: bingkai panel tetap ada, satu kalimat menjelaskan. */
export function EmptyState({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn("rounded-sm border border-dashed border-line px-5 py-6 text-[0.9375rem] text-muted", className)}>
      {children}
    </p>
  );
}
