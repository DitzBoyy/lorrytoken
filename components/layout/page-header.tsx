"use client";

import { usePathname } from "next/navigation";
import { findNavItem, ROLE_LABEL, type Role } from "@/lib/navigation";

/** Header putih: judul halaman di kiri, nama dan role pengguna di kanan. */
export function PageHeader({ role, userName, title }: { role: Role; userName: string; title?: string }) {
  const pathname = usePathname();
  const heading = title ?? findNavItem(role, pathname)?.title ?? "Loory Token System";

  return (
    <header className="border-b border-line bg-panel">
      <div className="flex min-h-16 items-center justify-between gap-6 px-4 py-3 sm:px-6 lg:min-h-[var(--header-height)] lg:px-10">
        <h1 className="font-display text-[1.625rem] font-bold leading-tight tracking-[-0.015em] lg:text-[2.125rem]">
          {heading}
        </h1>
        <div className="hidden text-right sm:block">
          <p className="font-semibold leading-snug">{userName}</p>
          <p className="text-[0.9375rem] leading-snug text-muted">{ROLE_LABEL[role]}</p>
        </div>
      </div>
    </header>
  );
}
