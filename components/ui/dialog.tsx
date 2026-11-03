"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

/**
 * Dialog modal dasar memakai <dialog> bawaan browser (fokus terkunci, Esc menutup).
 * Isi dan tombol aksi diberikan oleh pemanggil.
 */
export function Dialog({
  open,
  title,
  children,
  onClose,
  busy = false,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  /** Saat proses berjalan, Esc tidak menutup dialog. */
  busy?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-md border border-line bg-panel p-0 text-ink shadow-[0_12px_32px_rgb(30_40_48/0.22)] backdrop:bg-ink/60"
    >
      <div className="flex flex-col gap-4 p-6">
        <h2 id={titleId} className="font-display text-[1.5rem] leading-tight font-bold">
          {title}
        </h2>
        {open && children}
      </div>
    </dialog>
  );
}
