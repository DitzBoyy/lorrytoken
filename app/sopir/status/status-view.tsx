"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, buttonClass } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState, Notice } from "@/components/ui/notice";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Plate } from "@/components/ui/plate";
import { StatusTag } from "@/components/ui/status-tag";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { cn } from "@/lib/cn";
import { formatJamDari, formatRentang, formatTanggal, formatTanggalJam, formatTanggalPanjang } from "@/lib/format";
import { statusTampil, type PemesananSopir, type PemesananUtama, type StatusSopir } from "@/lib/pemesanan";
import { usePolling } from "@/lib/use-polling";
import { BarisPemesanan } from "../baris-pemesanan";

export function StatusAntrianView({ initial, kode }: { initial: StatusSopir; kode: string | null }) {
  const router = useRouter();
  const url = kode ? `/api/antrian/saya?kode=${encodeURIComponent(kode)}` : "/api/antrian/saya";
  const { data, error, refresh } = usePolling<StatusSopir>(url, initial);
  const [batalOpen, setBatalOpen] = useState(false);
  const [batalLoading, setBatalLoading] = useState(false);
  const [batalError, setBatalError] = useState<string | null>(null);

  const utama = data.utama;

  async function batalkan() {
    if (!utama) return;
    setBatalLoading(true);
    setBatalError(null);
    try {
      const response = await fetch(`/api/pemesanan/${utama.id_pemesanan}/batal`, { method: "POST" });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setBatalError(result.message ?? "Pemesanan gagal dibatalkan. Coba lagi.");
        setBatalLoading(false);
        return;
      }
      setBatalOpen(false);
      setBatalLoading(false);
      // Tetap tampilkan pemesanan yang baru dibatalkan agar statusnya terlihat.
      if (kode === utama.kode_booking) await refresh();
      else router.replace(`/sopir/status?kode=${utama.kode_booking}`, { scroll: false });
    } catch {
      setBatalError("Tidak dapat terhubung ke server. Coba lagi.");
      setBatalLoading(false);
    }
  }

  if (!utama) {
    return (
      <Panel aria-labelledby="judul-kosong">
        <PanelHeader id="judul-kosong" title="Belum ada pemesanan aktif" />
        <EmptyState>Anda belum memiliki pemesanan slot yang sedang berjalan.</EmptyState>
        <Link href="/sopir/pemesanan" className={cn(buttonClass("primary"), "mt-5")}>
          Pesan slot waktu
        </Link>
      </Panel>
    );
  }

  return (
    <div className="flex flex-col gap-6 lg:gap-7">
      <div className="grid items-stretch gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,8fr)] lg:gap-7">
        <Tiket p={utama} />

        <Panel aria-labelledby="judul-perjalanan" className="flex flex-col">
          <PanelHeader
            id="judul-perjalanan"
            title="Perjalanan antrian"
            aside={`Diperbarui otomatis, ${formatJamDari(data.diperbarui)}`}
          />
          <Langkah p={utama} />
          <div className="mt-7 flex flex-col gap-4">
            {error && (
              <Notice tone="error">Gagal memperbarui. Data terakhir pukul {formatJamDari(data.diperbarui)}.</Notice>
            )}
            <PesanStatus p={utama} />
            {utama.status_pemesanan === "dipesan" && (
              <div>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setBatalError(null);
                    setBatalOpen(true);
                  }}
                >
                  Batalkan pemesanan
                </Button>
              </div>
            )}
          </div>
        </Panel>
      </div>

      {data.lainnya.length > 0 && <PemesananLain items={data.lainnya} />}

      <ConfirmDialog
        open={batalOpen}
        title={`Batalkan ${utama.kode_booking}?`}
        confirmLabel="Ya, batalkan"
        loading={batalLoading}
        error={batalError}
        onConfirm={batalkan}
        onClose={() => setBatalOpen(false)}
      >
        Slot {formatRentang(utama.jam_mulai, utama.jam_selesai)} pada {formatTanggalPanjang(utama.tanggal)} dilepas
        untuk sopir lain. Pembatalan tidak bisa diurungkan.
      </ConfirmDialog>
    </div>
  );
}

/** Tiket nomor antrian besar. Sebelum check-in, kode pemesanan yang ditonjolkan. */
function Tiket({ p }: { p: PemesananUtama }) {
  const adaNomor = Boolean(p.nomor_antrian);
  const status = statusTampil(p);

  let infoLabel = "Tanggal";
  let infoValue = formatTanggal(p.tanggal);
  if (p.status_antrian === "menunggu") {
    infoLabel = "Estimasi mulai muat";
    infoValue = p.estimasi ? formatJamDari(p.estimasi) : "Belum dapat dihitung";
  } else if (p.status_antrian === "dimuat") {
    infoLabel = p.nama_dock ?? "Loading dock";
    infoValue = p.waktu_mulai ? `Mulai ${formatJamDari(p.waktu_mulai)}` : "Sedang dimuat";
  } else if (p.status_antrian === "selesai") {
    infoLabel = "Selesai muat";
    infoValue = p.waktu_selesai ? formatJamDari(p.waktu_selesai) : "Selesai";
  }

  return (
    <section aria-label="Tiket antrian" className="flex flex-col overflow-hidden rounded-md bg-ink text-white">
      <div className="flex flex-1 flex-col px-6 pt-6 pb-5 sm:px-8 sm:pt-7">
        <div className="flex items-start justify-between gap-4">
          <p className="text-[0.9375rem] text-on-ink-muted">{adaNomor ? "Nomor antrian" : "Kode pemesanan"}</p>
          <StatusTag status={status} />
        </div>
        {adaNomor ? (
          <p className="mt-2 font-display text-[6rem] leading-[0.9] font-bold tracking-[-0.03em] tabular-nums sm:text-[7.5rem]">
            {p.nomor_antrian}
          </p>
        ) : (
          <p className="mt-3 font-display text-[2.5rem] leading-none font-bold tracking-[-0.01em] tabular-nums break-all sm:text-[3rem]">
            {p.kode_booking}
          </p>
        )}
        {!adaNomor && p.status_pemesanan === "dipesan" && (
          <p className="mt-3 text-[0.9375rem] text-on-ink-muted">Nomor antrian diberikan saat check-in di gerbang.</p>
        )}
      </div>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-5 border-t border-dashed border-ink-line px-6 py-5 sm:px-8">
        {adaNomor ? (
          <div>
            <dt className="text-sm text-on-ink-muted">Kode pemesanan</dt>
            <dd className="mt-1 font-bold tabular-nums">{p.kode_booking}</dd>
          </div>
        ) : (
          <div>
            <dt className="text-sm text-on-ink-muted">Tanggal</dt>
            <dd className="mt-1 font-bold">{formatTanggal(p.tanggal)}</dd>
          </div>
        )}
        <div>
          <dt className="text-sm text-on-ink-muted">Truk</dt>
          <dd className="mt-1">
            <Plate value={p.no_polisi} size="sm" />
          </dd>
        </div>
      </dl>
      <dl className="grid grid-cols-2 gap-x-6 border-t border-dashed border-ink-line px-6 py-5 sm:px-8">
        <div>
          <dt className="text-sm text-on-ink-muted">Slot</dt>
          <dd className="mt-1 text-lg font-bold tabular-nums">{formatRentang(p.jam_mulai, p.jam_selesai)}</dd>
        </div>
        <div>
          <dt className="text-sm text-on-ink-muted">{adaNomor ? infoLabel : "Dipesan"}</dt>
          <dd className="mt-1 text-lg font-bold tabular-nums">{adaNomor ? infoValue : formatTanggalJam(p.tgl_pesan)}</dd>
        </div>
      </dl>
      <div aria-hidden="true" className="h-3 bg-accent" />
    </section>
  );
}

type Step = { label: string; detail: string | null };

/** Alur status: Dipesan, Check-in, Menunggu, Dimuat, Selesai. */
function Langkah({ p }: { p: PemesananUtama }) {
  const steps: Step[] = [
    { label: "Dipesan", detail: formatTanggalJam(p.tgl_pesan) },
    { label: "Check-in", detail: p.waktu_kedatangan ? formatTanggalJam(p.waktu_kedatangan) : null },
    {
      label: "Menunggu",
      detail:
        p.status_antrian === "menunggu" && p.trukDiDepan !== null
          ? p.trukDiDepan === 0
            ? "Berikutnya"
            : `${p.trukDiDepan} truk di depan`
          : null,
    },
    {
      label: "Dimuat",
      detail: p.waktu_mulai ? `${p.nama_dock ? `${p.nama_dock}, ` : ""}${formatJamDari(p.waktu_mulai)}` : null,
    },
    { label: "Selesai", detail: p.waktu_selesai ? formatJamDari(p.waktu_selesai) : null },
  ];

  // Indeks langkah yang sedang berlangsung. Semua langkah sebelumnya dianggap selesai.
  let current = 0;
  if (p.status_antrian === "menunggu") current = 2;
  else if (p.status_antrian === "dimuat") current = 3;
  else if (p.status_antrian === "selesai") current = 5;
  const berhenti = p.status_pemesanan === "dibatalkan" || p.status_pemesanan === "tidak hadir";

  return (
    <ol className="flex flex-col gap-0 sm:grid sm:grid-cols-5">
      {steps.map((step, index) => {
        const done = !berhenti && index < current;
        const active = !berhenti && index === current;
        const state = done ? "selesai" : active ? "sedang berlangsung" : "belum";
        return (
          <li
            key={step.label}
            aria-current={active ? "step" : undefined}
            className="relative flex gap-4 pb-6 last:pb-0 sm:flex-col sm:items-center sm:gap-0 sm:pb-0 sm:text-center"
          >
            {/* Garis penghubung: vertikal di ponsel, horizontal di layar lebar */}
            {index < steps.length - 1 && (
              <span
                aria-hidden="true"
                className={cn(
                  "absolute top-7 bottom-0 left-[13px] w-0.5 sm:top-[13px] sm:right-[-50%] sm:bottom-auto sm:left-1/2 sm:h-0.5 sm:w-auto",
                  done && index + 1 <= current ? "bg-steel" : "bg-line",
                )}
              />
            )}
            <span
              aria-hidden="true"
              className={cn(
                "relative z-10 mt-0.5 size-7 flex-none rounded-full border-[3px] transition-colors duration-150",
                done && "border-steel bg-steel",
                active && "border-ink bg-accent",
                !done && !active && "border-line bg-panel",
              )}
            />
            <div className="sm:mt-3">
              <p className={cn("font-bold", !done && !active && "text-muted")}>
                {step.label}
                <span className="sr-only">, {state}</span>
              </p>
              {step.detail && <p className="text-sm text-muted tabular-nums">{step.detail}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function PesanStatus({ p }: { p: PemesananUtama }) {
  if (p.status_pemesanan === "dibatalkan") {
    return <Notice tone="neutral">Pemesanan ini sudah dibatalkan. Kuota slot sudah dilepas untuk sopir lain.</Notice>;
  }
  if (p.status_pemesanan === "tidak hadir") {
    return <Notice tone="error">Pemesanan ini ditandai tidak hadir oleh petugas. Pesan slot baru bila masih perlu memuat.</Notice>;
  }
  if (p.status_pemesanan === "dipesan") {
    return (
      <Notice tone="info">
        Datang pada {formatTanggalPanjang(p.tanggal)}, slot {formatRentang(p.jam_mulai, p.jam_selesai)}. Tunjukkan kode
        pemesanan ke petugas di gerbang.
      </Notice>
    );
  }
  if (p.status_antrian === "menunggu") {
    const depan = p.trukDiDepan ?? 0;
    // Format "YYYY-MM-DD HH:MM:SS" bisa dibandingkan sebagai teks.
    const lewatSlot = p.estimasi !== null && p.estimasi > `${p.tanggal} ${p.jam_selesai}`;
    return (
      <Notice tone="menunggu">
        {depan === 0 ? (
          <>
            <strong>Anda berikutnya.</strong> Tunggu panggilan petugas ke loading dock.
          </>
        ) : (
          <>
            <strong>{depan} truk</strong> di depan Anda.
          </>
        )}{" "}
        {lewatSlot && "Estimasi melewati jam slot karena antrian sedang padat. "}
        Estimasi bisa berubah mengikuti ketersediaan loading dock. Halaman ini diperbarui otomatis.
      </Notice>
    );
  }
  if (p.status_antrian === "dimuat") {
    return (
      <Notice tone="dimuat">
        Truk Anda sedang dimuat di <strong>{p.nama_dock ?? "loading dock"}</strong>
        {p.waktu_mulai ? ` sejak ${formatJamDari(p.waktu_mulai)}` : ""}.
      </Notice>
    );
  }
  return (
    <Notice tone="success">
      Pemuatan selesai{p.waktu_selesai ? ` pukul ${formatJamDari(p.waktu_selesai)}` : ""}. Truk boleh meninggalkan area muat.
    </Notice>
  );
}

function PemesananLain({ items }: { items: PemesananSopir[] }) {
  return (
    <Panel aria-labelledby="judul-pemesanan-lain">
      <PanelHeader id="judul-pemesanan-lain" title="Pemesanan aktif lainnya" />
      <ul className="flex flex-col md:hidden">
        {items.map((p) => (
          <li key={p.id_pemesanan} className="border-b border-line-soft last:border-b-0">
            <BarisPemesanan p={p} />
          </li>
        ))}
      </ul>
      <div className="hidden md:block">
        <Table caption="Pemesanan aktif lainnya">
          <THead>
            <tr>
              <TH>Kode pemesanan</TH>
              <TH>Tanggal</TH>
              <TH>Slot</TH>
              <TH>Truk</TH>
              <TH>Status</TH>
            </tr>
          </THead>
          <TBody>
            {items.map((p) => (
              <TR key={p.id_pemesanan}>
                <TD>
                  <Link
                    href={`/sopir/status?kode=${p.kode_booking}`}
                    className="font-semibold tabular-nums underline-offset-4 hover:underline"
                  >
                    {p.kode_booking}
                  </Link>
                </TD>
                <TD>{formatTanggal(p.tanggal)}</TD>
                <TD className="tabular-nums">{formatRentang(p.jam_mulai, p.jam_selesai)}</TD>
                <TD>
                  <Plate value={p.no_polisi} size="sm" />
                </TD>
                <TD>
                  <StatusTag status={statusTampil(p)} />
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </div>
    </Panel>
  );
}
