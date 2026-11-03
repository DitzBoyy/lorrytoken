import "server-only";
import { NextResponse } from "next/server";
import { isConnectionError } from "./db";

/** Respons 500 yang seragam. Detail error hanya dicatat di log server. */
export function serverError(error: unknown) {
  console.error(error);
  const message = isConnectionError(error)
    ? "Server tidak dapat terhubung ke database. Coba lagi nanti."
    : "Terjadi kesalahan pada server. Coba lagi.";
  return NextResponse.json({ message }, { status: 500 });
}

/**
 * Penolakan aturan bisnis. Dilempar di dalam transaksi agar terjadi rollback,
 * lalu diubah menjadi respons JSON oleh `tolakAtauError`.
 */
export class Ditolak extends Error {
  constructor(
    message: string,
    readonly status = 409,
    readonly errors?: Partial<Record<string, string>>,
  ) {
    super(message);
  }
}

export function tolakAtauError(error: unknown) {
  if (error instanceof Ditolak) {
    return NextResponse.json({ message: error.message, errors: error.errors }, { status: error.status });
  }
  return serverError(error);
}

/** Mengurai parameter id dari URL menjadi bilangan bulat positif, atau null. */
export function parseId(value: string): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}
