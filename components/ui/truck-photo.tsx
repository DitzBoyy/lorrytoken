import Image from "next/image";
import { cn } from "@/lib/cn";

/**
 * Foto truk, atau gambar truk sederhana bila foto belum ada.
 * Foto diunggah saat aplikasi berjalan, jadi tidak melewati optimasi gambar Next.js.
 */
export function TruckPhoto({
  src,
  alt,
  className,
}: {
  src?: string | null;
  alt: string;
  className?: string;
}) {
  return (
    <div className={cn("relative aspect-[4/3] overflow-hidden rounded-sm bg-line-soft", className)}>
      {src ? (
        <Image src={src} alt={alt} fill unoptimized sizes="320px" className="object-cover" />
      ) : (
        <TruckDrawing label={alt} />
      )}
    </div>
  );
}

/** Gambar truk datar sebagai pengganti foto. */
function TruckDrawing({ label }: { label: string }) {
  return (
    <svg viewBox="0 0 120 90" role="img" aria-label={label} className="h-full w-full">
      <rect x="0" y="72" width="120" height="18" className="fill-line" />
      <rect x="14" y="30" width="62" height="34" rx="1" className="fill-on-ink-muted" />
      <path d="M78 40h16l10 12v12H78z" className="fill-steel" />
      <rect x="83" y="44" width="10" height="8" rx="1" className="fill-line-soft" />
      <circle cx="30" cy="68" r="7" className="fill-ink" />
      <circle cx="30" cy="68" r="2.5" className="fill-line-soft" />
      <circle cx="90" cy="68" r="7" className="fill-ink" />
      <circle cx="90" cy="68" r="2.5" className="fill-line-soft" />
    </svg>
  );
}
