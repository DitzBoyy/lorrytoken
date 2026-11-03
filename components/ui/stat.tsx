import { cn } from "@/lib/cn";
import { formatAngka } from "@/lib/format";

/**
 * Angka ringkasan (dashboard dan laporan). Label kecil di atas, angka besar condensed di bawah.
 * Nilai null ditulis "-" dengan keterangan untuk pembaca layar.
 */
export function Stat({
  label,
  value,
  unit,
  className,
}: {
  label: string;
  value: number | null;
  unit?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-2 rounded-md border border-line bg-panel px-5 py-5 sm:px-6", className)}>
      <dt className="text-[0.9375rem] leading-snug text-steel">{label}</dt>
      <dd className="flex items-baseline gap-2 font-display font-bold text-ink">
        {value == null ? (
          <>
            <span aria-hidden="true" className="text-[2.75rem] leading-none text-muted">
              -
            </span>
            <span className="sr-only">belum ada data</span>
          </>
        ) : (
          <>
            <span className="text-[2.75rem] leading-none tabular-nums">{formatAngka(value)}</span>
            {unit && <span className="text-xl leading-none text-steel">{unit}</span>}
          </>
        )}
      </dd>
    </div>
  );
}
