import Link from "next/link";
import { cn } from "@/lib/cn";
import { formatTabTanggal, formatTanggalPanjang } from "@/lib/format";

/** Tab tanggal ("Min 1", "Sen 2", ...) sebagai tautan ?tanggal=YYYY-MM-DD. Menggulir ke samping di layar sempit. */
export function DateTabs({ hrefBase, tanggal, aktif }: { hrefBase: string; tanggal: string[]; aktif: string | null }) {
  return (
    <nav aria-label="Pilih tanggal" className="-mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
      <ul className="flex gap-2">
        {tanggal.map((item) => {
          const current = item === aktif;
          return (
            <li key={item}>
              <Link
                href={`${hrefBase}?tanggal=${item}`}
                replace
                scroll={false}
                aria-current={current ? "date" : undefined}
                className={cn(
                  "inline-flex h-11 items-center rounded-sm border px-4 font-semibold whitespace-nowrap transition-colors duration-150",
                  current ? "border-ink bg-ink text-white" : "border-steel bg-panel text-ink hover:bg-subtle",
                )}
              >
                {formatTabTanggal(item)}
                <span className="sr-only">, {formatTanggalPanjang(item)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
