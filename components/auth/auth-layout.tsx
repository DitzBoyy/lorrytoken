import type { ReactNode } from "react";
import { HazardStripe } from "@/components/ui/panel";

/**
 * Tata letak halaman Login dan Registrasi (mockup 01 dan 02): panel gelap berisi nama sistem
 * dengan garis hazard di bawah, form di sisi kanan. Di ponsel panel gelap menjadi pita ringkas di atas.
 */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2">
      <div className="relative flex flex-col bg-ink lg:sticky lg:top-0 lg:h-screen">
        <div className="flex flex-1 flex-col px-4 pt-6 pb-7 sm:px-10 lg:px-[4.5rem] lg:pt-16 lg:pb-24">
          <p className="text-[0.9375rem] text-on-ink-muted">PT. SASL And Sons Indonesia</p>
          <div className="mt-3 lg:mt-auto lg:mb-auto lg:pt-24">
            <p className="font-display text-[2.25rem] leading-none font-bold tracking-[-0.02em] text-white lg:text-[4.5rem] lg:leading-[0.95]">
              Loory
              <br className="hidden lg:block" /> Token
              <br className="hidden lg:block" /> System
            </p>
            <p className="mt-6 hidden max-w-[28rem] text-lg leading-relaxed text-on-ink-muted lg:block">
              Pesan jadwal kedatangan, pantau giliran muat, dan lihat status truk tanpa menunggu di gerbang.
            </p>
          </div>
        </div>
        <HazardStripe className="h-3 lg:h-6" />
      </div>

      <main className="px-4 py-8 sm:px-10 lg:px-[11%] lg:py-16">
        <div className="w-full max-w-[34rem]">{children}</div>
      </main>
    </div>
  );
}

/** Judul halaman dan kalimat penjelas di atas form. */
export function AuthHeading({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-7">
      <h1 className="font-display text-[1.75rem] leading-tight font-bold tracking-[-0.015em] lg:text-[2rem]">
        {title}
      </h1>
      <p className="mt-1 text-[0.9375rem] text-muted">{description}</p>
    </div>
  );
}
