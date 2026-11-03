import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "dark" | "secondary" | "danger" | "ghost";
type Size = "md" | "sm";

const base =
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-sm border font-semibold " +
  "transition-colors duration-150 disabled:cursor-not-allowed";

const variants: Record<Variant, string> = {
  // Aksi utama: satu per area kerja
  primary:
    "border-accent bg-accent text-ink hover:border-accent-hover hover:bg-accent-hover " +
    "disabled:border-line disabled:bg-line-soft disabled:text-muted",
  dark:
    "border-ink bg-ink text-white hover:border-ink-raised hover:bg-ink-raised " +
    "disabled:border-line disabled:bg-line-soft disabled:text-muted",
  secondary:
    "border-steel bg-panel text-ink hover:bg-subtle " +
    "disabled:border-line disabled:bg-subtle disabled:text-muted",
  danger:
    "border-error bg-panel text-error hover:bg-error-bg " +
    "disabled:border-line disabled:bg-subtle disabled:text-muted",
  ghost:
    "border-transparent bg-transparent text-ink underline-offset-4 hover:underline " +
    "disabled:text-muted disabled:no-underline",
};

const sizes: Record<Size, string> = {
  md: "h-[var(--control-height)] px-5 text-[0.9375rem]",
  sm: "h-[var(--control-height)] px-4 text-sm md:h-[var(--control-height-sm)] md:px-3.5",
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  /** Menampilkan teks proses dan menonaktifkan tombol selama permintaan berjalan. */
  loading?: boolean;
  loadingText?: string;
  fullWidth?: boolean;
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  loadingText = "Memproses",
  fullWidth = false,
  className,
  children,
  disabled,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(base, variants[variant], sizes[size], fullWidth && "w-full", className)}
      {...props}
    >
      {loading ? `${loadingText}…` : children}
    </button>
  );
}

/** Kelas tombol untuk elemen lain (misalnya Link) agar tampil sama. */
export function buttonClass(variant: Variant = "primary", size: Size = "md", fullWidth = false) {
  return cn(base, variants[variant], sizes[size], fullWidth && "w-full");
}
