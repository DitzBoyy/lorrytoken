import type { Metadata } from "next";
import Link from "next/link";
import { buttonClass } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/notice";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Plate } from "@/components/ui/plate";
import { StatusTag } from "@/components/ui/status-tag";
import { Missing, Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { requirePageRole } from "@/lib/auth";
import { getPemesananSopir } from "@/lib/data/pemesanan";
import { formatJamDari, formatRentang, formatTanggal } from "@/lib/format";
import { statusTampil } from "@/lib/pemesanan";
import { BarisPemesanan } from "../baris-pemesanan";

export const metadata: Metadata = { title: "Riwayat Pemesanan" };

export default async function RiwayatPage() {
  const user = await requirePageRole("sopir");
  const riwayat = await getPemesananSopir(user.id);

  return (
    <Panel aria-labelledby="judul-riwayat">
      <PanelHeader id="judul-riwayat" title="Semua pemesanan" aside={`${riwayat.length} pemesanan`} />

      {riwayat.length === 0 ? (
        <>
          <EmptyState>Belum ada pemesanan. Riwayat muncul setelah Anda memesan slot waktu.</EmptyState>
          <Link href="/sopir/pemesanan" className={`${buttonClass("primary")} mt-5`}>
            Pesan slot waktu
          </Link>
        </>
      ) : (
        <>
          {/* Ponsel: baris dua tingkat */}
          <ul className="flex flex-col md:hidden">
            {riwayat.map((p) => (
              <li key={p.id_pemesanan} className="border-b border-line-soft last:border-b-0">
                <BarisPemesanan p={p} tampilkanSelesai />
              </li>
            ))}
          </ul>

          <div className="hidden md:block">
            <Table caption="Riwayat pemesanan slot waktu">
              <THead>
                <tr>
                  <TH>Kode pemesanan</TH>
                  <TH>Tanggal</TH>
                  <TH>Slot</TH>
                  <TH>Truk</TH>
                  <TH>No. antrian</TH>
                  <TH>Selesai muat</TH>
                  <TH>Status</TH>
                </tr>
              </THead>
              <TBody>
                {riwayat.map((p) => (
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
                    <TD className="font-display text-lg font-bold">{p.nomor_antrian ?? <Missing />}</TD>
                    <TD className="tabular-nums">{p.waktu_selesai ? formatJamDari(p.waktu_selesai) : <Missing />}</TD>
                    <TD>
                      <StatusTag status={statusTampil(p)} />
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </div>
        </>
      )}
    </Panel>
  );
}
