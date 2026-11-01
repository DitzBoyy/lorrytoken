"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Mengambil ulang data JSON setiap `intervalMs` (CLAUDE.md: polling 5 detik, tanpa WebSocket).
 * Data lama tetap ditampilkan bila satu pengambilan gagal. Saat tab kembali aktif, data langsung diambil ulang.
 */
export function usePolling<T>(url: string, initial: T, intervalMs = 5000) {
  const [data, setData] = useState<T>(initial);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const router = useRouter();

  const refresh = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    try {
      const response = await fetch(url, { cache: "no-store", signal: controller.signal });
      if (response.status === 401) {
        // Sesi berakhir: kembali ke halaman login.
        router.replace("/login");
        return;
      }
      const body = await response.json();
      if (!response.ok) throw new Error(body.message ?? "Gagal memperbarui data.");
      setData(body as T);
      setError(null);
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setError((err as Error).message || "Gagal memperbarui data.");
    }
  }, [url, router]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, intervalMs);
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      controllerRef.current?.abort();
    };
  }, [refresh, intervalMs]);

  return { data, error, refresh };
}
