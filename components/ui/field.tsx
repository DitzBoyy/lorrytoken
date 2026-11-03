import { useId, type ComponentPropsWithRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";

const control =
  "block w-full rounded-sm border bg-panel px-4 text-base text-ink placeholder:text-muted " +
  "h-[var(--control-height)] transition-colors duration-150 " +
  "focus:border-ink focus:outline-2 focus:outline-offset-0 focus:outline-ink " +
  "disabled:cursor-not-allowed disabled:bg-subtle disabled:text-muted";

type FieldShellProps = {
  id: string;
  label: string;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
  hideLabel?: boolean;
};

function FieldShell({ id, label, hint, error, required, children, className, hideLabel }: FieldShellProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={id} className={hideLabel ? "sr-only" : "text-[0.9375rem] text-steel"}>
        {label}
        {required && <span className="sr-only"> (wajib diisi)</span>}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-sm text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-sm font-medium text-error">
          {error}
        </p>
      )}
    </div>
  );
}

function describedBy(id: string, hint?: ReactNode, error?: string) {
  if (error) return `${id}-error`;
  if (hint) return `${id}-hint`;
  return undefined;
}

type InputProps = ComponentPropsWithRef<"input"> & {
  label: string;
  hint?: ReactNode;
  error?: string;
  wrapperClassName?: string;
  /** Elemen di sisi kanan dalam kolom, misalnya tombol tampilkan kata sandi. */
  trailing?: ReactNode;
  /** Label hanya untuk pembaca layar (judul panel sudah menjelaskan kolom). */
  hideLabel?: boolean;
};

export function TextField({
  label,
  hint,
  error,
  id,
  wrapperClassName,
  className,
  required,
  trailing,
  hideLabel,
  ...props
}: InputProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const input = (
    <input
      id={fieldId}
      required={required}
      aria-invalid={error ? true : undefined}
      aria-describedby={describedBy(fieldId, hint, error)}
      className={cn(control, error ? "border-error" : "border-line", trailing ? "pr-32" : undefined, className)}
      {...props}
    />
  );
  return (
    <FieldShell
      id={fieldId}
      label={label}
      hint={hint}
      error={error}
      required={required}
      className={wrapperClassName}
      hideLabel={hideLabel}
    >
      {trailing ? (
        <div className="relative">
          {input}
          <div className="absolute inset-y-0 right-0 flex items-center pr-1">{trailing}</div>
        </div>
      ) : (
        input
      )}
    </FieldShell>
  );
}

type SelectProps = ComponentPropsWithRef<"select"> & {
  label: string;
  hint?: ReactNode;
  error?: string;
  wrapperClassName?: string;
};

export function SelectField({
  label,
  hint,
  error,
  id,
  wrapperClassName,
  className,
  required,
  children,
  ...props
}: SelectProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <FieldShell id={fieldId} label={label} hint={hint} error={error} required={required} className={wrapperClassName}>
      <div className="relative">
        <select
          id={fieldId}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(fieldId, hint, error)}
          className={cn(control, "appearance-none pr-10", error ? "border-error" : "border-line", className)}
          {...props}
        >
          {children}
        </select>
        <svg
          aria-hidden="true"
          viewBox="0 0 12 8"
          className="pointer-events-none absolute right-4 top-1/2 h-2 w-3 -translate-y-1/2 text-ink"
        >
          <path d="M1 1.5 6 6.5l5-5" fill="none" stroke="currentColor" strokeWidth="1.75" />
        </svg>
      </div>
    </FieldShell>
  );
}
