"use client";

import { useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { HazardStripe } from "@/components/ui/panel";
import { ROLE_LABEL, type Role } from "@/lib/navigation";
import { Brand } from "./brand";
import { SidebarNav } from "./sidebar-nav";

/**
 * Di bawah breakpoint lg, sidebar dilipat menjadi bar atas gelap dengan tombol Menu.
 * Menu terbuka sebagai lembar penuh layar dengan daftar halaman dan tombol Keluar.
 */
export function MobileNav({ role, userName }: { role: Role; userName: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const [lastPathname, setLastPathname] = useState(pathname);
  const panelId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);

  // Tutup menu setiap kali halaman berganti (termasuk lewat tombol kembali browser).
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  // Esc menutup menu, dan fokus kembali ke tombol Menu.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div>
      <div className="relative z-30 bg-ink">
        <HazardStripe className="h-2" />
        <div className="flex h-14 items-center justify-between gap-4 px-4">
          <Brand compact />
          <button
            ref={toggleRef}
            type="button"
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => setOpen((value) => !value)}
            className="inline-flex h-11 min-w-11 items-center gap-2 rounded-sm border border-ink-line px-3 text-[0.9375rem] font-semibold text-white focus-visible:outline-accent"
          >
            <svg aria-hidden="true" viewBox="0 0 18 14" className="h-3.5 w-[18px]">
              {open ? (
                <path d="M2 1l14 12M16 1L2 13" stroke="currentColor" strokeWidth="2" />
              ) : (
                <path d="M0 1h18M0 7h18M0 13h18" stroke="currentColor" strokeWidth="2" />
              )}
            </svg>
            {open ? "Tutup" : "Menu"}
          </button>
        </div>
      </div>

      {open && (
        <div id={panelId} className="fixed inset-x-0 top-[4rem] bottom-0 z-20 overflow-y-auto bg-ink">
          <div className="border-b border-ink-line px-6 py-5">
            <p className="font-semibold text-white">{userName}</p>
            <p className="text-[0.9375rem] text-on-ink-muted">{ROLE_LABEL[role]}</p>
          </div>
          <SidebarNav role={role} onNavigate={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}
