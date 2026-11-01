"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { Button } from "./button";
import { Notice } from "./notice";

/**
 * Dialog konfirmasi untuk aksi yang tidak bisa diulang (hapus, batal).
 * Memakai <dialog> bawaan browser: fokus terkunci di dalam dialog dan Esc menutupnya.
 */
export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  cancelLabel = "Kembali",
  loading = false,
  error,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  loading?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onClose: () => void;
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
        if (!loading) onClose();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-md border border-line bg-panel p-0 text-ink shadow-[0_12px_32px_rgb(30_40_48/0.22)] backdrop:bg-ink/60"
    >
      <div className="flex flex-col gap-4 p-6">
        <h2 id={titleId} className="font-display text-[1.5rem] leading-tight font-bold">
          {title}
        </h2>
        <div className="text-[0.9375rem] leading-relaxed text-steel">{children}</div>
        {error && <Notice tone="error">{error}</Notice>}
        <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={loading} loadingText="Memproses">
            {confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
