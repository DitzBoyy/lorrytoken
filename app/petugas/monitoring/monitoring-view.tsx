"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState, Notice } from "@/components/ui/notice";
import { HazardStripe, Panel, PanelHeader } from "@/components/ui/panel";
import { Plate } from "@/components/ui/plate";
import { StatusTag } from "@/components/ui/status-tag";
import { Missing, Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { cn } from "@/lib/cn";
import { formatJamDari } from "@/lib/format";
import type { AntrianMenunggu, DockMonitor, Monitoring } from "@/lib/petugas";
import { usePolling } from "@/lib/use-polling";

export function MonitoringView({ initial }: { initial: Monitoring }) {
  const { data, error, refresh } = usePolling<Monitoring>("/api/antrian/monitoring", initial);
  const [aksiError, setAksiError] = useState<string | null>(null);
  const [proses, setProses] = useState<string | null>(null);
  const [pilihDock, setPilihDock] = useState<AntrianMenunggu | null>(null);
  const [selesai, setSelesai] = useState<DockMonitor | null>(null);
  const [selesaiError, setSelesaiError] = useState<string | null>(null);

  const dockTersedia = data.dock.filter((d) => d.status_dock === "tersedia");
  const terdepan = data.menunggu[0] ?? null;
  const adaDock = dockTersedia.length > 0;
  // Hanya dock tersedia pertama yang memakai tombol kuning, agar aksi utama tetap satu.
  const dockUtama = dockTersedia[0]?.id_dock ?? null;

  async function alokasi(antrian: AntrianMenunggu, idDock: number) {
    setProses(`alokasi-${antrian.id_antrian}`);
    setAksiError(null);
    try {
      const response = await fetch(`/api/antrian/${antrian.id_antrian}/alokasi`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_dock: idDock }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) setAksiError(result.message ?? "Alokasi gagal. Coba lagi.");
      setPilihDock(null);
      await refresh();
    } catch {
      setAksiError("Tidak dapat terhubung ke server. Coba lagi.");
    } finally {
      setProses(null);
    }
  }

  async function tandaiSelesai() {
    if (!selesai?.id_antrian) return;
    setProses(`selesai-${selesai.id_antrian}`);
    setSelesaiError(null);
    try {
      const response = await fetch(`/api/antrian/${selesai.id_antrian}/selesai`, { method: "POST" });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setSelesaiError(result.message ?? "Gagal menandai selesai. Coba lagi.");
        return;
      }
      setSelesai(null);
      await refresh();
    } catch {
      setSelesaiError("Tidak dapat terhubung ke server. Coba lagi.");
    } finally {
      setProses(null);
    }
  }

  return (
    <div className="flex flex-col gap-6 lg:gap-7">
      {error && <Notice tone="error">Gagal memperbarui. Data terakhir pukul {formatJamDari(data.diperbarui)}.</Notice>}
      {aksiError && <Notice tone="error">{aksiError}</Notice>}

      <section aria-labelledby="judul-dock">
        <h2 id="judul-dock" className="sr-only">
          Loading dock
        </h2>
        <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {data.dock.map((dock) => (
            <li key={dock.id_dock}>
              <DockCard
                dock={dock}
                terdepan={terdepan}
                utama={dock.id_dock === dockUtama}
                sibuk={proses !== null}
                onAlokasi={() => terdepan && alokasi(terdepan, dock.id_dock)}
                onSelesai={() => {
                  setSelesaiError(null);
                  setSelesai(dock);
                }}
              />
            </li>
          ))}
        </ul>
      </section>

      <Panel aria-labelledby="judul-menunggu">
        <PanelHeader
          id="judul-menunggu"
          title="Antrian menunggu"
          aside={`${data.menunggu.length} truk · selesai hari ini ${data.selesaiHariIni} · diperbarui otomatis ${formatJamDari(data.diperbarui)}`}
        />
        {!adaDock && data.menunggu.length > 0 && (
          <Notice tone="neutral" className="mb-5">
            Semua loading dock sedang digunakan atau nonaktif. Tombol Alokasikan aktif lagi setelah ada dock tersedia.
          </Notice>
        )}

        {data.menunggu.length === 0 ? (
          <EmptyState>Tidak ada truk yang menunggu. Truk muncul di sini setelah check-in di Verifikasi Kedatangan.</EmptyState>
        ) : (
          <Table caption="Antrian truk yang menunggu loading dock">
            <THead>
              <tr>
                <TH>No. antrian</TH>
                <TH>Truk</TH>
                <TH>Sopir</TH>
                <TH>Tiba</TH>
                <TH>Estimasi</TH>
                <TH>Status</TH>
                <TH>
                  <span className="sr-only">Aksi</span>
                </TH>
              </tr>
            </THead>
            <TBody>
              {data.menunggu.map((row, index) => (
                <TR key={row.id_antrian}>
                  <TD primary>{row.nomor_antrian}</TD>
                  <TD>
                    <Plate value={row.no_polisi} size="sm" />
                  </TD>
                  <TD>{row.nama_sopir}</TD>
                  <TD className="tabular-nums">{formatJamDari(row.waktu_kedatangan)}</TD>
                  <TD className="tabular-nums">{row.estimasi ? formatJamDari(row.estimasi) : <Missing />}</TD>
                  <TD>
                    <StatusTag status="menunggu" />
                  </TD>
                  <TD className="text-right">
                    <Button
                      size="sm"
                      variant={index === 0 ? "primary" : "secondary"}
                      disabled={!adaDock || proses !== null}
                      onClick={() => {
                        setAksiError(null);
                        setPilihDock(row);
                      }}
                    >
                      Alokasikan<span className="sr-only"> {row.nomor_antrian}</span>
                    </Button>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Panel>

      <Dialog
        open={pilihDock !== null}
        title={pilihDock ? `Alokasikan ${pilihDock.nomor_antrian}` : "Alokasikan"}
        busy={proses !== null}
        onClose={() => setPilihDock(null)}
      >
        {pilihDock && (
          <div className="flex flex-col gap-4">
            <p className="text-[0.9375rem] text-steel">
              Pilih loading dock untuk truk <strong className="text-ink">{pilihDock.no_polisi}</strong> ({pilihDock.nama_sopir}).
            </p>
            {dockTersedia.length === 0 ? (
              <Notice tone="neutral">Tidak ada dock yang tersedia saat ini.</Notice>
            ) : (
              <ul className="flex flex-col gap-2">
                {dockTersedia.map((dock) => (
                  <li key={dock.id_dock}>
                    <Button
                      variant="secondary"
                      fullWidth
                      className="justify-between"
                      loading={proses === `alokasi-${pilihDock.id_antrian}`}
                      loadingText="Mengalokasikan"
                      disabled={proses !== null}
                      onClick={() => alokasi(pilihDock, dock.id_dock)}
                    >
                      <span>{dock.nama_dock}</span>
                      <span className="text-sm font-normal text-muted">{dock.keterangan ?? "Tersedia"}</span>
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            <Button variant="ghost" className="self-start px-0" onClick={() => setPilihDock(null)} disabled={proses !== null}>
              Batal
            </Button>
          </div>
        )}
      </Dialog>

      <ConfirmDialog
        open={selesai !== null}
        title={selesai ? `Selesaikan ${selesai.nomor_antrian} di ${selesai.nama_dock}?` : "Selesaikan pemuatan?"}
        confirmLabel="Ya, selesai"
        tone="primary"
        loading={proses?.startsWith("selesai-") ?? false}
        error={selesaiError}
        onConfirm={tandaiSelesai}
        onClose={() => setSelesai(null)}
      >
        {selesai && (
          <>
            Waktu selesai dicatat sekarang dan {selesai.nama_dock} kembali tersedia untuk truk berikutnya.
          </>
        )}
      </ConfirmDialog>
    </div>
  );
}

function DockCard({
  dock,
  terdepan,
  utama,
  sibuk,
  onAlokasi,
  onSelesai,
}: {
  dock: DockMonitor;
  terdepan: AntrianMenunggu | null;
  utama: boolean;
  sibuk: boolean;
  onAlokasi: () => void;
  onSelesai: () => void;
}) {
  const digunakan = dock.status_dock === "digunakan";
  const tersedia = dock.status_dock === "tersedia";

  return (
    <article
      aria-labelledby={`dock-${dock.id_dock}`}
      className="flex h-full flex-col overflow-hidden rounded-md border border-line bg-panel"
    >
      {digunakan ? (
        <HazardStripe />
      ) : (
        <div aria-hidden="true" className={cn("h-3.5 transition-colors duration-150", tersedia ? "bg-selesai" : "bg-line")} />
      )}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 id={`dock-${dock.id_dock}`} className="font-display text-[1.75rem] leading-none font-bold">
            {dock.nama_dock}
          </h3>
          <StatusTag status={dock.status_dock} />
        </div>
        {dock.keterangan && dock.status_dock !== "nonaktif" && (
          <p className="-mt-1 text-sm text-muted">{dock.keterangan}</p>
        )}

        {digunakan && dock.id_antrian ? (
          <>
            {dock.no_polisi && <Plate value={dock.no_polisi} />}
            <div>
              <p>{dock.nama_sopir}</p>
              <p className="text-[0.9375rem] text-muted tabular-nums">
                {dock.nomor_antrian} · mulai {dock.waktu_mulai ? formatJamDari(dock.waktu_mulai) : ""}
              </p>
            </div>
            <Button variant="secondary" fullWidth className="mt-auto justify-start" disabled={sibuk} onClick={onSelesai}>
              Selesai<span className="sr-only"> memuat {dock.nomor_antrian}</span>
            </Button>
          </>
        ) : tersedia ? (
          <>
            <p className="text-muted">Kosong</p>
            <Button
              variant={utama ? "primary" : "secondary"}
              fullWidth
              className="mt-auto justify-start"
              disabled={!terdepan || sibuk}
              onClick={onAlokasi}
            >
              {terdepan ? `Alokasikan ${terdepan.nomor_antrian}` : "Tidak ada antrian"}
            </Button>
          </>
        ) : (
          <p className="text-muted">{dock.keterangan ?? (digunakan ? "Sedang digunakan" : "Tidak dipakai")}</p>
        )}
      </div>
    </article>
  );
}
