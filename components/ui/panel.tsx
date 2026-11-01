import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Panel putih berbingkai tipis, radius kecil, tanpa bayangan. */
export function Panel({
  children,
  className,
  as: Tag = "section",
  "aria-labelledby": labelledBy,
}: {
  children: ReactNode;
  className?: string;
  as?: "section" | "div" | "article";
  "aria-labelledby"?: string;
}) {
  return (
    <Tag aria-labelledby={labelledBy} className={cn("min-w-0 rounded-md border border-line bg-panel p-5 sm:p-7", className)}>
      {children}
    </Tag>
  );
}

/** Judul panel di kiri, keterangan atau aksi di kanan. */
export function PanelHeader({
  title,
  id,
  aside,
  className,
}: {
  title: string;
  id?: string;
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-5 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1", className)}>
      <h2 id={id} className="font-display text-[1.5rem] font-bold leading-tight tracking-[-0.01em]">
        {title}
      </h2>
      {aside && <div className="text-[0.9375rem] text-muted">{aside}</div>}
    </div>
  );
}

/** Garis hazard kuning-hitam. Dipakai di atas sidebar dan di atas kartu dock yang sedang dipakai. */
export function HazardStripe({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("hazard h-3.5 w-full", className)} />;
}
