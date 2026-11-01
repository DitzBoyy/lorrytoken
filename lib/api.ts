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

/** Mengurai parameter id dari URL menjadi bilangan bulat positif, atau null. */
export function parseId(value: string): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}
