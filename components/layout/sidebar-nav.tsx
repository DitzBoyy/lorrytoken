"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { NAV, type Role } from "@/lib/navigation";

const itemBase =
  "relative flex min-h-12 items-center px-6 text-base leading-snug transition-colors duration-150 lg:px-7";

/** Menu sidebar. Menu aktif ditandai bilah kuning di kiri dan latar sedikit lebih terang. */
export function SidebarNav({ role, onNavigate }: { role: Role; onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Menu utama" className="flex flex-col py-5">
      <ul className="flex flex-col">
        {NAV[role].map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  itemBase,
                  "focus-visible:outline-accent focus-visible:-outline-offset-2",
                  active
                    ? "bg-ink-raised text-white before:absolute before:inset-y-0 before:left-0 before:w-1.5 before:bg-accent"
                    : "text-white/85 hover:bg-ink-raised hover:text-white",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>

      <p className="mt-6 px-6 pb-1 text-sm text-on-ink-muted lg:px-7">Akun</p>
      {/* Logout memakai POST agar tidak terpicu oleh prefetch tautan. */}
      <form action="/api/auth/logout" method="post">
        <button
          type="submit"
          className={cn(
            itemBase,
            "w-full text-left text-white/85 hover:bg-ink-raised hover:text-white",
            "focus-visible:outline-accent focus-visible:-outline-offset-2",
          )}
        >
          Keluar
        </button>
      </form>
    </nav>
  );
}
