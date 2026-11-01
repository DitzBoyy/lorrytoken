"use client";

import { useId, useState, type ComponentPropsWithRef, type ReactNode } from "react";
import { TextField } from "./field";

type Props = Omit<ComponentPropsWithRef<"input">, "type"> & {
  label: string;
  hint?: ReactNode;
  error?: string;
  wrapperClassName?: string;
};

/** Kolom kata sandi dengan tombol Tampilkan atau Sembunyikan di dalamnya. */
export function PasswordField({ id, ...props }: Props) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const [visible, setVisible] = useState(false);

  return (
    <TextField
      {...props}
      id={fieldId}
      type={visible ? "text" : "password"}
      autoCapitalize="none"
      autoCorrect="off"
      spellCheck={false}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          aria-controls={fieldId}
          aria-pressed={visible}
          className="h-[calc(var(--control-height)-8px)] rounded-xs px-3 text-sm font-semibold text-ink underline-offset-4 hover:underline"
        >
          {visible ? "Sembunyikan" : "Tampilkan"}
          <span className="sr-only"> kata sandi</span>
        </button>
      }
    />
  );
}
