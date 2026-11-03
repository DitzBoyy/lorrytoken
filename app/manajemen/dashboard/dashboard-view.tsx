"use client";

import { EmptyState, Notice } from "@/components/ui/notice";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Plate } from "@/components/ui/plate";
import { Stat } from "@/components/ui/stat";
import { StatusTag } from "@/components/ui/status-tag";
import { Missing, Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { formatJam, formatJamDari, formatRentang } from "@/lib/format";
import type { Dashboard, SlotHariIni } from "@/lib/manajemen";
import { usePolling } from "@/lib/use-polling";

export function DashboardView({ initial }: { initial: Dashboard }) {
  const { data, error } = usePolling<Dashboard>("/api/antrian/dashboard", initial);

  return (
    <div className="flex flex-col gap-6 lg:gap-7">
      {error && <Notice tone="error">Gagal memperbarui. Data terakhir pukul {formatJamDari(data.diperbarui)}.</Notice>}

      <section aria-labelledby="judul-ringkasan">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <h2 id="judul-ringkasan" className="font-display text-[1.25rem] font-bold leading-tight">
            Hari ini
          </h2>
          <p className="text-sm text-muted">Diperbarui otomatis {formatJamDari(data.diperbarui)}</p>
        </div>
        <dl className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6 xl:gap-5">
          <Stat label="Truk terdaftar hari ini" value={data.terdaftar} />
          <Stat label="Menunggu" value={data.menunggu} />
          <Stat label="Sedang dimuat" value={data.dimuat} />
          <Stat label="Selesai" value={data.selesai} />
          <Stat label="Rata-rata waktu tunggu" value={data.rataTunggu} unit="menit" />
          <Stat label="Rata-rata waktu pelayanan" value={data.rataPelayanan} unit="menit" />
        </dl>
      </section>

      <div className="grid gap-6 lg:gap-7 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <Panel aria-labelledby="judul-slot">
          <PanelHeader id="judul-slot" title="Pemesanan per slot hari ini" />
          {data.perSlot.length === 0 ? (
            <EmptyState>Belum ada slot waktu aktif untuk hari ini. Petugas bisa menambahkannya di menu Slot Waktu & Loading Dock.</EmptyState>
          ) : (
            <GrafikSlot slot={data.perSlot} />
          )}
        </Panel>

        <Panel aria-labelledby="judul-dock">
          <PanelHeader id="judul-dock" title="Status loading dock" />
          <Table caption="Status setiap loading dock" className="[&_table]:min-w-0">
            <THead>
              <tr>
                <TH>Dock</TH>
                <TH>Status</TH>
                <TH>Truk</TH>
              </tr>
            </THead>
            <TBody>
              {data.dock.map((dock) => (
                <TR key={dock.id_dock}>
                  <TD>{dock.nama_dock}</TD>
                  <TD>
                    <StatusTag status={dock.status_dock} />
                  </TD>
                  <TD>{dock.no_polisi ? <Plate value={dock.no_polisi} size="sm" /> : <Missing />}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Panel>
      </div>
    </div>
  );
}

/**
 * Grafik batang satu seri: jumlah pemesanan (tidak dibatalkan) per slot aktif hari ini.
 * Skala dari 0 sampai kuota terbesar, sehingga batang penuh berarti slot penuh.
 * Tabel tersembunyi menyediakan angka yang sama untuk pembaca layar.
 */
function GrafikSlot({ slot }: { slot: SlotHariIni[] }) {
  const skala = Math.max(1, ...slot.map((s) => Math.max(s.kuota, s.jumlah)));

  return (
    <figure className="m-0">
      <div className="-mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
        <div aria-hidden="true" className="flex flex-col sm:min-w-[28rem]">
          <div className="flex h-56 items-end gap-0.5 border-b border-line">
            {slot.map((s) => {
              const tinggi = (s.jumlah / skala) * 100;
              const penuh = s.jumlah >= s.kuota;
              return (
                <div
                  key={s.id_slot}
                  title={`${formatRentang(s.jam_mulai, s.jam_selesai)}: ${s.jumlah} dari ${s.kuota} kuota`}
                  className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2 px-0.5 sm:px-3"
                >
                  <span className={"text-sm tabular-nums " + (penuh ? "font-bold text-ink" : "text-steel")}>
                    {s.jumlah}
                    <span className="font-normal text-muted">/{s.kuota}</span>
                  </span>
                  <div
                    className={
                      "w-full max-w-20 rounded-t-[4px] transition-[height,background-color] duration-300 " +
                      (penuh ? "bg-ink" : "bg-steel")
                    }
                    style={{ height: `${tinggi}%`, minHeight: s.jumlah > 0 ? 4 : 0 }}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex gap-0.5 pt-2">
            {slot.map((s) => (
              <span key={s.id_slot} className="min-w-0 flex-1 text-center text-sm text-muted tabular-nums">
                {formatJam(s.jam_mulai)}
              </span>
            ))}
          </div>
        </div>
      </div>
      <figcaption className="mt-4 text-sm text-muted">
        Angka di atas batang: pemesanan yang tidak dibatalkan dibanding kuota slot. Batang gelap berarti slot penuh.
      </figcaption>
      <table className="sr-only">
        <caption>Pemesanan per slot hari ini</caption>
        <thead>
          <tr>
            <th scope="col">Slot</th>
            <th scope="col">Pemesanan</th>
            <th scope="col">Kuota</th>
          </tr>
        </thead>
        <tbody>
          {slot.map((s) => (
            <tr key={s.id_slot}>
              <th scope="row">{formatRentang(s.jam_mulai, s.jam_selesai)}</th>
              <td>{s.jumlah}</td>
              <td>{s.kuota}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
