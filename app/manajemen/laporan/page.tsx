import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Plate } from "@/components/ui/plate";
import { Stat } from "@/components/ui/stat";
import { StatusTag } from "@/components/ui/status-tag";
import { Missing, Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { requirePageRole } from "@/lib/auth";
import { getLaporan } from "@/lib/data/manajemen";
import { formatJamDari, formatTanggal, formatTanggalJam, toIsoDate } from "@/lib/format";
import { toDateTimeString } from "@/lib/data/antrian";
import { parsePeriode } from "@/lib/laporan-input";
import type { Laporan } from "@/lib/manajemen";
import { CetakButton } from "./cetak-button";

export const metadata: Metadata = { title: "Laporan Antrian" };

export default async function LaporanPage({ searchParams }: PageProps<"/manajemen/laporan">) {
  await requirePageRole("manajemen");
  const params = await searchParams;
  const periode = parsePeriode(params.awal, params.akhir);
  const laporan = periode.ok ? await getLaporan(periode.awal, periode.akhir) : null;
  const errors = periode.ok ? {} : periode.errors;
  const hariIni = toIsoDate(new Date());
  const adaData = laporan !== null && (laporan.baris.length > 0 || laporan.tidakHadir > 0);

  return (
    <div className="laporan flex flex-col gap-6 lg:gap-7">
      <Panel className="no-print" aria-labelledby="judul-periode">
        <h2 id="judul-periode" className="sr-only">
          Periode laporan
        </h2>
        {/* Form GET biasa: periode tersimpan di URL sehingga laporan bisa dibuka ulang atau dibagikan. */}
        <form method="get" className="flex flex-col gap-5 md:flex-row md:flex-wrap md:items-start">
          <TextField
            label="Tanggal awal"
            name="awal"
            type="date"
            defaultValue={periode.awal}
            max={hariIni}
            error={errors.awal}
            required
            wrapperClassName="md:w-60"
          />
          <TextField
            label="Tanggal akhir"
            name="akhir"
            type="date"
            defaultValue={periode.akhir}
            max={hariIni}
            error={errors.akhir}
            required
            wrapperClassName="md:w-60"
          />
          <div className="flex flex-col gap-3 sm:flex-row md:mt-[calc(1.40625rem+0.5rem)]">
            <Button type="submit" variant="dark">
              Tampilkan
            </Button>
            {adaData && <CetakButton />}
          </div>
        </form>
      </Panel>

      {laporan && (
        <>
          <div className="print-only">
            <p className="text-sm">PT. SASL And Sons Indonesia</p>
            <p className="font-display text-2xl font-bold">Laporan Antrian Truk Muatan</p>
            <p className="text-sm">
              Periode {formatPeriode(laporan.awal, laporan.akhir)} · Dicetak {formatTanggalJam(toDateTimeString(new Date()))}
            </p>
          </div>

          {adaData ? <IsiLaporan laporan={laporan} /> : (
            <Notice tone="neutral">
              Data tidak tersedia untuk periode {formatPeriode(laporan.awal, laporan.akhir)}. Pilih
              periode lain lalu klik Tampilkan.
            </Notice>
          )}
        </>
      )}
    </div>
  );
}

function IsiLaporan({ laporan }: { laporan: Laporan }) {
  return (
    <>
      <dl className="grid grid-cols-2 gap-4 xl:grid-cols-4 xl:gap-5">
        <Stat label="Truk terlayani" value={laporan.terlayani} />
        <Stat label="Rata-rata waktu tunggu" value={laporan.rataTunggu} unit="menit" />
        <Stat label="Rata-rata waktu pelayanan" value={laporan.rataPelayanan} unit="menit" />
        <Stat label="Tidak hadir" value={laporan.tidakHadir} />
      </dl>

      <Panel aria-labelledby="judul-rincian">
        <PanelHeader
          id="judul-rincian"
          title="Rincian per truk"
          aside={`${laporan.baris.length} antrian · ${formatPeriode(laporan.awal, laporan.akhir)}`}
        />
        {laporan.baris.length === 0 ? (
          <Notice tone="neutral">Tidak ada truk yang check-in pada periode ini.</Notice>
        ) : (
          <Table caption="Rincian waktu tunggu dan waktu pelayanan per truk">
            <THead>
              <tr>
                <TH>Tanggal</TH>
                <TH>No. antrian</TH>
                <TH>Truk</TH>
                <TH>Sopir</TH>
                <TH>Tiba</TH>
                <TH>Mulai muat</TH>
                <TH>Selesai</TH>
                <TH numeric>Waktu tunggu</TH>
                <TH numeric>Waktu pelayanan</TH>
              </tr>
            </THead>
            <TBody>
              {laporan.baris.map((row) => (
                <TR key={row.id_antrian}>
                  <TD className="tabular-nums">{formatTanggal(row.tanggal)}</TD>
                  <TD primary>{row.nomor_antrian}</TD>
                  <TD>
                    <Plate value={row.no_polisi} size="sm" />
                  </TD>
                  <TD>{row.nama_sopir}</TD>
                  <TD className="tabular-nums">{formatJamDari(row.waktu_kedatangan)}</TD>
                  <TD className="tabular-nums">
                    {row.waktu_mulai ? formatWaktuDiHari(row.waktu_mulai, row.tanggal) : <Missing />}
                  </TD>
                  <TD className="tabular-nums">
                    {row.waktu_selesai ? (
                      formatWaktuDiHari(row.waktu_selesai, row.tanggal)
                    ) : (
                      <StatusTag status={row.status_antrian} />
                    )}
                  </TD>
                  <TD numeric>{row.waktu_tunggu == null ? <Missing /> : `${row.waktu_tunggu} mnt`}</TD>
                  <TD numeric>{row.waktu_pelayanan == null ? <Missing /> : `${row.waktu_pelayanan} mnt`}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Panel>
    </>
  );
}

/** "3 Nov 2026" untuk satu hari, "1 Nov 2026 sampai 3 Nov 2026" untuk rentang. */
function formatPeriode(awal: string, akhir: string) {
  return awal === akhir ? formatTanggal(awal) : `${formatTanggal(awal)} sampai ${formatTanggal(akhir)}`;
}

/** Jam saja bila masih di hari kedatangan, tanggal dan jam bila sudah berganti hari. */
function formatWaktuDiHari(waktu: string, tanggal: string) {
  return waktu.startsWith(tanggal) ? formatJamDari(waktu) : formatTanggalJam(waktu);
}
