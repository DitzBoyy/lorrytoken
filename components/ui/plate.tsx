import { cn } from "@/lib/cn";

type Size = "sm" | "md" | "lg";

const sizes: Record<Size, string> = {
  sm: "h-7 px-2 text-[0.9375rem]",
  md: "h-9 px-3 text-lg",
  lg: "h-12 px-4 text-2xl",
};

/**
 * Nomor plat ditampilkan seperti pelat kendaraan: kotak berbingkai tebal, huruf condensed tebal.
 * Nilai disimpan apa adanya, tampilan dipaksa huruf kapital.
 */
export function Plate({
  value,
  size = "md",
  className,
}: {
  value: string;
  size?: Size;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex w-fit flex-none items-center whitespace-nowrap rounded-xs border-[length:var(--plate-border)] border-ink bg-panel",
        "font-display font-bold uppercase leading-none tracking-wide text-ink",
        sizes[size],
        className,
      )}
    >
      <span className="sr-only">Nomor plat </span>
      {value}
    </span>
  );
}
