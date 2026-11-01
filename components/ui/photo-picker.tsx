"use client";

import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { PHOTO_MAX_BYTES, PHOTO_TYPES } from "@/lib/validation";
import { TruckPhoto } from "./truck-photo";

/**
 * Pemilih foto truk (mockup 02 dan 03): kotak bergaris putus dengan pratinjau foto,
 * nama file, dan batas format. Input file asli tetap ada untuk keyboard dan pembaca layar.
 */
export function PhotoPicker({
  name,
  label = "Foto truk",
  error,
  required,
  onValidityChange,
  currentSrc,
}: {
  name: string;
  label?: string;
  error?: string;
  required?: boolean;
  /** Dipanggil dengan pesan error dari pemeriksaan di browser, atau null bila foto valid. */
  onValidityChange?: (message: string | null) => void;
  /** Foto yang sudah tersimpan (mode ubah). Tetap dipakai bila tidak memilih foto baru. */
  currentSrc?: string | null;
}) {
  const inputId = useId();
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      setFileName(null);
      setPreviewUrl(null);
      return;
    }
    let message: string | null = null;
    if (!(PHOTO_TYPES as readonly string[]).includes(file.type)) message = "Foto harus berformat JPG atau PNG.";
    else if (file.size > PHOTO_MAX_BYTES) message = "Ukuran foto maksimal 2 MB.";

    onValidityChange?.(message);
    if (message) {
      event.target.value = "";
      setFileName(null);
      setPreviewUrl(null);
      return;
    }
    setFileName(file.name);
    setPreviewUrl(URL.createObjectURL(file));
  }

  return (
    <div className="flex flex-col gap-2">
      <span id={`${inputId}-label`} className="text-[0.9375rem] text-steel">
        {label}
      </span>
      <label
        htmlFor={inputId}
        className={cn(
          "group flex cursor-pointer items-center gap-4 rounded-sm border border-dashed bg-panel p-3 transition-colors duration-150",
          "hover:border-steel has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink",
          error ? "border-error" : "border-steel/60",
        )}
      >
        <input
          ref={inputRef}
          id={inputId}
          name={name}
          type="file"
          accept="image/jpeg,image/png"
          required={required}
          aria-labelledby={`${inputId}-label`}
          aria-describedby={error ? errorId : hintId}
          aria-invalid={error ? true : undefined}
          onChange={handleChange}
          className="sr-only"
        />
        <TruckPhoto
          src={previewUrl ?? currentSrc}
          alt={fileName ? "Pratinjau foto truk" : currentSrc ? "Foto truk saat ini" : ""} className="w-28 flex-none sm:w-32" />
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate font-bold text-ink">{fileName ?? (currentSrc ? "Foto saat ini" : "Pilih foto")}</span>
          <span id={hintId} className="text-sm text-muted">
            JPG atau PNG, maks.{" "}2{" "}MB
          </span>
          {(fileName || currentSrc) && <span className="text-sm font-bold text-ink underline underline-offset-4">Ganti foto</span>}
        </span>
      </label>
      {error && (
        <p id={errorId} className="text-sm font-medium text-error">
          {error}
        </p>
      )}
    </div>
  );
}
