import type { ReactNode, TdHTMLAttributes, ThHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/**
 * Tabel kerja. Pembungkus menggulir ke samping di layar sempit sehingga halaman
 * tidak ikut melebar. Tanpa zebra, garis baris tipis, header huruf biasa.
 */
export function Table({
  children,
  caption,
  className,
}: {
  children: ReactNode;
  /** Keterangan untuk pembaca layar. */
  caption?: string;
  className?: string;
}) {
  return (
    <div className={cn("-mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0", className)}>
      <table className="w-full min-w-[40rem] border-collapse text-left text-[0.9375rem]">
        {caption && <caption className="sr-only">{caption}</caption>}
        {children}
      </table>
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return <thead className="bg-subtle">{children}</thead>;
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody>{children}</tbody>;
}

export function TR({ children, className }: { children: ReactNode; className?: string }) {
  return <tr className={cn("border-b border-line-soft last:border-b-0", className)}>{children}</tr>;
}

type ThProps = ThHTMLAttributes<HTMLTableCellElement> & { numeric?: boolean };

export function TH({ children, numeric, className, ...props }: ThProps) {
  return (
    <th
      scope="col"
      className={cn(
        "h-11 border-b-2 border-line px-4 align-middle text-sm font-semibold whitespace-nowrap text-steel",
        numeric && "text-right",
        className,
      )}
      {...props}
    >
      {children}
    </th>
  );
}

type TdProps = TdHTMLAttributes<HTMLTableCellElement> & {
  numeric?: boolean;
  /** Kolom identitas (nomor antrian, kode pemesanan) memakai tinta penuh dan huruf condensed. */
  primary?: boolean;
};

export function TD({ children, numeric, primary, className, ...props }: TdProps) {
  return (
    <td
      className={cn(
        "h-[4.25rem] px-4 align-middle whitespace-nowrap",
        numeric && "text-right tabular-nums",
        primary ? "font-display text-lg font-bold text-ink" : "text-ink",
        className,
      )}
      {...props}
    >
      {children}
    </td>
  );
}

/** Nilai kosong ditulis sebagai tanda strip abu, bukan dikosongkan. */
export function Missing() {
  return (
    <span className="text-muted">
      <span aria-hidden="true">-</span>
      <span className="sr-only">tidak ada</span>
    </span>
  );
}
