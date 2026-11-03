"use client";

import { Button } from "@/components/ui/button";

/** Membuka dialog cetak browser. Tampilan cetak diatur oleh @media print di globals.css. */
export function CetakButton() {
  return (
    <Button variant="secondary" onClick={() => window.print()}>
      Cetak laporan
    </Button>
  );
}
