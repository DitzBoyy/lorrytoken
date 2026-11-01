import Link from "next/link";
import { Plate } from "@/components/ui/plate";
import { StatusTag } from "@/components/ui/status-tag";
import { formatJamDari, formatRentang, formatTanggal } from "@/lib/format";
import { statusTampil, type PemesananSopir } from "@/lib/pemesanan";

/**
 * Satu pemesanan sebagai baris daftar di ponsel. Seluruh baris adalah satu tautan ke Status Antrian
 * agar mudah ditekan dengan jempol (tinggi minimal 56 px).
 */
export function BarisPemesanan({ p, tampilkanSelesai = false }: { p: PemesananSopir; tampilkanSelesai?: boolean }) {
  return (
    <Link
      href={`/sopir/status?kode=${p.kode_booking}`}
      className="-mx-2 flex min-h-14 items-center gap-3 rounded-sm px-2 py-3.5 transition-colors duration-150 hover:bg-subtle"
    >
      <span className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className="flex items-center justify-between gap-3">
          <span className="font-bold tabular-nums">
            {p.kode_booking}
            {p.nomor_antrian && <span className="font-normal text-muted"> · {p.nomor_antrian}</span>}
          </span>
          <StatusTag status={statusTampil(p)} />
        </span>
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[0.9375rem] text-muted">
          <span className="tabular-nums">
            {formatTanggal(p.tanggal)}, {formatRentang(p.jam_mulai, p.jam_selesai)}
          </span>
          <Plate value={p.no_polisi} size="sm" />
          {tampilkanSelesai && p.waktu_selesai && (
            <span className="tabular-nums">Selesai muat {formatJamDari(p.waktu_selesai)}</span>
          )}
        </span>
      </span>
      <svg aria-hidden="true" viewBox="0 0 8 14" className="h-3.5 w-2 flex-none text-steel">
        <path d="M1 1l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.75" />
      </svg>
    </Link>
  );
}
