/** Nama sistem dan perusahaan di bagian atas sidebar. */
export function Brand({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <p className="font-display text-[1.375rem] font-bold leading-none tracking-[-0.01em] text-white">
        Loory Token System
      </p>
    );
  }
  return (
    <div className="px-6 pt-7 pb-6 lg:px-7">
      <p className="font-display text-[1.625rem] font-bold leading-tight whitespace-nowrap tracking-[-0.01em] text-white">
        Loory Token System
      </p>
      <p className="mt-1 text-[0.9375rem] text-on-ink-muted">PT. SASL And Sons Indonesia</p>
    </div>
  );
}
