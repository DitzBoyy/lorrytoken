import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { SelectField, TextField } from "@/components/ui/field";
import { EmptyState, Notice } from "@/components/ui/notice";
import { HazardStripe, Panel, PanelHeader } from "@/components/ui/panel";
import { Plate } from "@/components/ui/plate";
import { StatusTag, type StatusValue } from "@/components/ui/status-tag";
import { Missing, Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

/*
 * SEMENTARA: halaman pratinjau komponen dasar untuk pengecekan langkah 3.
 * Bukan bagian dari daftar halaman di BAB IV. Dihapus sebelum langkah 6.
 */

export const metadata: Metadata = { title: "Pratinjau komponen" };

const antrian = [
  { nomor: "A-013", plat: "B 9567 KS", sopir: "Rudi Hartono", tiba: "07.49", estimasi: "08.10" },
  { nomor: "A-014", plat: "B 9123 KXT", sopir: "Budi Santoso", tiba: "07.52", estimasi: "08.25" },
  { nomor: "A-015", plat: "B 9702 UJ", sopir: "Agus Salim", tiba: "08.03", estimasi: "08.40" },
  { nomor: "A-016", plat: "D 8811 AB", sopir: "Joko Susilo", tiba: "08.11", estimasi: null },
];

const statusGroups: { judul: string; nilai: StatusValue[] }[] = [
  { judul: "Pemesanan", nilai: ["dipesan", "check-in", "dibatalkan", "tidak hadir"] },
  { judul: "Antrian", nilai: ["menunggu", "dimuat", "selesai"] },
  { judul: "Loading dock", nilai: ["tersedia", "digunakan", "nonaktif"] },
  { judul: "Slot waktu", nilai: ["aktif", "nonaktif"] },
];

export default function PratinjauPage() {
  return (
    <AppShell user={{ nama: "Rina Kartika", role: "petugas" }} title="Pratinjau komponen">
      <div className="flex flex-col gap-7">
        <Notice tone="neutral">
          Halaman sementara untuk memeriksa komponen dasar. Halaman ini dihapus setelah semua halaman selesai.
        </Notice>

        {/* Kartu dock: contoh garis hazard di atas panel yang sedang dipakai */}
        <section aria-labelledby="judul-dock" className="flex flex-col gap-4">
          <h2 id="judul-dock" className="font-display text-[1.5rem] font-bold">
            Garis hazard dan pelat nomor
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <article className="overflow-hidden rounded-md border border-line bg-panel">
              <HazardStripe />
              <div className="flex flex-col gap-3 p-5">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-display text-[1.75rem] font-bold leading-none">Dock 1</h3>
                  <StatusTag status="digunakan" />
                </div>
                <Plate value="B 9045 KL" />
                <div>
                  <p>Andi Pratama</p>
                  <p className="text-[0.9375rem] text-muted">A-011, mulai 07.58</p>
                </div>
                <Button variant="secondary" fullWidth className="justify-start">
                  Selesai
                </Button>
              </div>
            </article>
            <article className="overflow-hidden rounded-md border border-line bg-panel">
              <div aria-hidden="true" className="h-3.5 bg-selesai" />
              <div className="flex flex-col gap-3 p-5">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-display text-[1.75rem] font-bold leading-none">Dock 3</h3>
                  <StatusTag status="tersedia" />
                </div>
                <p className="text-muted">Kosong</p>
                <Button fullWidth className="mt-auto justify-start">
                  Alokasikan A-013
                </Button>
              </div>
            </article>
            <div className="flex flex-col gap-4 rounded-md border border-line bg-panel p-5 sm:col-span-2">
              <p className="text-[0.9375rem] text-steel">Pelat nomor tiga ukuran</p>
              <div className="flex flex-wrap items-center gap-4">
                <Plate value="B 9123 KXT" size="sm" />
                <Plate value="B 9478 UYZ" size="md" />
                <Plate value="D 8811 AB" size="lg" />
              </div>
              <div className="flex items-center gap-4 rounded-sm bg-ink p-4">
                <span className="text-[0.9375rem] text-on-ink-muted">Di atas tiket gelap</span>
                <Plate value="B 9123 KXT" />
              </div>
            </div>
          </div>
        </section>

        <div className="grid items-start gap-7 xl:grid-cols-[minmax(0,1fr)_26rem]">
          <Panel aria-labelledby="judul-tabel">
            <PanelHeader id="judul-tabel" title="Antrian menunggu" aside="Diperbarui otomatis, 08.14" />
            <Table caption="Contoh tabel antrian menunggu">
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
                {antrian.map((row, index) => (
                  <TR key={row.nomor}>
                    <TD primary>{row.nomor}</TD>
                    <TD>
                      <Plate value={row.plat} size="sm" />
                    </TD>
                    <TD>{row.sopir}</TD>
                    <TD className="tabular-nums">{row.tiba}</TD>
                    <TD className="tabular-nums">{row.estimasi ?? <Missing />}</TD>
                    <TD>
                      <StatusTag status="menunggu" />
                    </TD>
                    <TD className="text-right">
                      <Button size="sm" disabled={index > 0}>
                        Alokasikan
                      </Button>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </Panel>

          <Panel aria-labelledby="judul-form">
            <PanelHeader id="judul-form" title="Form" />
            <form className="flex flex-col gap-5">
              <TextField label="Nomor plat truk" name="no_polisi" defaultValue="B 9455 KA" required />
              <SelectField label="Jenis truk" name="jenis_truk" defaultValue="Wingbox">
                <option value="">Pilih jenis truk</option>
                <option>Engkel box</option>
                <option>Double engkel</option>
                <option>Wingbox</option>
                <option>Tronton</option>
              </SelectField>
              <TextField
                label="Kapasitas muatan (kg)"
                name="kapasitas_muatan"
                type="number"
                inputMode="numeric"
                defaultValue={15000}
                hint="Boleh dikosongkan dan dilengkapi nanti."
              />
              <TextField label="Email" name="email" type="email" error="Email wajib diisi." required />
              <TextField label="Kata sandi" name="password" type="password" disabled placeholder="Tidak bisa diubah" />
              <Button type="button" fullWidth>
                Simpan truk
              </Button>
            </form>
          </Panel>
        </div>

        <div className="grid items-start gap-7 lg:grid-cols-2">
          <Panel aria-labelledby="judul-tombol">
            <PanelHeader id="judul-tombol" title="Tombol" />
            <div className="flex flex-col gap-5">
              <div className="flex flex-wrap gap-3">
                <Button>Pesan slot</Button>
                <Button variant="secondary">Ubah</Button>
                <Button variant="danger">Batalkan pemesanan</Button>
                <Button variant="ghost">Lihat riwayat</Button>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button disabled>Alokasikan</Button>
                <Button loading loadingText="Menyimpan">
                  Simpan
                </Button>
                <Button size="sm">Check-in</Button>
                <Button size="sm" variant="secondary">
                  Tidak hadir
                </Button>
              </div>
            </div>
          </Panel>

          <Panel aria-labelledby="judul-status">
            <PanelHeader id="judul-status" title="Tag status" />
            <dl className="flex flex-col gap-4">
              {statusGroups.map((group) => (
                <div key={group.judul} className="grid gap-2 sm:grid-cols-[8rem_1fr] sm:items-center">
                  <dt className="text-[0.9375rem] text-steel">{group.judul}</dt>
                  <dd className="flex flex-wrap gap-2">
                    {group.nilai.map((value) => (
                      <StatusTag key={value} status={value} />
                    ))}
                  </dd>
                </div>
              ))}
            </dl>
          </Panel>
        </div>

        <Panel aria-labelledby="judul-pesan">
          <PanelHeader id="judul-pesan" title="Pesan dan keadaan kosong" />
          <div className="grid gap-4 lg:grid-cols-2">
            <Notice tone="menunggu">
              <strong>1 truk</strong> di depan Anda. Estimasi bisa berubah mengikuti ketersediaan loading dock.
            </Notice>
            <Notice tone="success">Pemesanan tersimpan. Kode pemesanan BK-20261101-0001.</Notice>
            <Notice tone="error">Slot penuh. Pilih slot waktu lain.</Notice>
            <EmptyState>Data tidak tersedia untuk periode ini.</EmptyState>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
