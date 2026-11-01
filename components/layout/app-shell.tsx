import type { ReactNode } from "react";
import { HazardStripe } from "@/components/ui/panel";
import type { Role } from "@/lib/navigation";
import { Brand } from "./brand";
import { MobileNav } from "./mobile-nav";
import { PageHeader } from "./page-header";
import { SidebarNav } from "./sidebar-nav";

export type ShellUser = { nama: string; role: Role };

/**
 * Kerangka semua halaman setelah login: sidebar gelap di kiri (desktop) atau bar atas (ponsel),
 * header putih, lalu area konten di atas latar abu.
 */
export function AppShell({ user, title, children }: { user: ShellUser; title?: string; children: ReactNode }) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[var(--sidebar-width)_minmax(0,1fr)]">
      <a
        href="#konten"
        className="sr-only z-50 bg-accent px-4 py-3 font-semibold text-ink focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Lewati ke konten
      </a>

      <aside className="hidden bg-ink lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:overflow-y-auto print:hidden">
        <HazardStripe />
        <Brand />
        <div className="border-t border-ink-line" />
        <SidebarNav role={user.role} />
      </aside>

      <div className="sticky top-0 z-30 lg:hidden print:hidden">
        <MobileNav role={user.role} userName={user.nama} />
      </div>

      <div className="flex min-w-0 flex-col">
        <PageHeader role={user.role} userName={user.nama} title={title} />
        <main id="konten" className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-9">
          {children}
        </main>
      </div>
    </div>
  );
}
