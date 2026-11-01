"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState, Notice } from "@/components/ui/notice";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Plate } from "@/components/ui/plate";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { TruckPhoto } from "@/components/ui/truck-photo";
import { formatKg } from "@/lib/format";
import type { Truk } from "@/lib/truk";
import { TrukForm } from "./truk-form";

function BelumDiisi() {
  return <span className="text-muted">Belum diisi</span>;
}

export function DataTrukView({ truk }: { truk: Truk[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Truk | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [saved, setSaved] = useState<string | null>(null);
  const [hapus, setHapus] = useState<Truk | null>(null);
  const [hapusLoading, setHapusLoading] = useState(false);
  const [hapusError, setHapusError] = useState<string | null>(null);

  function mulaiUbah(item: Truk) {
    setEditing(item);
    setSaved(null);
    setFormKey((key) => key + 1);
    // Di ponsel form ada di bawah daftar: bawa sopir ke form.
    document.getElementById("form-truk")?.scrollIntoView({ block: "start" });
  }

  function selesaiSimpan(noPolisi: string) {
    setSaved(editing ? `Perubahan truk ${noPolisi} tersimpan.` : `Truk ${noPolisi} tersimpan.`);
    setEditing(null);
    setFormKey((key) => key + 1);
    router.refresh();
    // Pesan sukses ada di atas daftar; di ponsel form ada di bawah, jadi bawa sopir ke pesan itu.
    requestAnimationFrame(() => document.getElementById("judul-truk-terdaftar")?.scrollIntoView({ block: "start" }));
  }

  async function konfirmasiHapus() {
    if (!hapus) return;
    setHapusLoading(true);
    setHapusError(null);
    try {
      const response = await fetch(`/api/truk/${hapus.id_truk}`, { method: "DELETE" });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setHapusError(result.message ?? "Truk gagal dihapus. Coba lagi.");
        setHapusLoading(false);
        return;
      }
      if (editing?.id_truk === hapus.id_truk) {
        setEditing(null);
        setFormKey((key) => key + 1);
      }
      setSaved(`Truk ${hapus.no_polisi} dihapus.`);
      setHapus(null);
      setHapusLoading(false);
      router.refresh();
    } catch {
      setHapusError("Tidak dapat terhubung ke server. Coba lagi.");
      setHapusLoading(false);
    }
  }

  const aksi = (item: Truk) => (
    <div className="flex gap-3 md:gap-2">
      <Button size="sm" variant="secondary" onClick={() => mulaiUbah(item)}>
        Ubah<span className="sr-only"> truk {item.no_polisi}</span>
      </Button>
      <Button
        size="sm"
        variant="secondary"
        onClick={() => {
          setHapusError(null);
          setHapus(item);
        }}
      >
        Hapus<span className="sr-only"> truk {item.no_polisi}</span>
      </Button>
    </div>
  );

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,26rem)] lg:gap-7">
      <Panel aria-labelledby="judul-truk-terdaftar">
        <PanelHeader id="judul-truk-terdaftar" title="Truk terdaftar" aside={`${truk.length} truk`} />

        {saved && (
          <Notice tone="success" className="mb-5 scroll-mt-24">
            {saved}
          </Notice>
        )}

        {truk.length === 0 ? (
          <EmptyState>Belum ada truk. Isi form Tambah truk agar bisa memesan slot waktu.</EmptyState>
        ) : (
          <>
            {/* Ponsel: baris dua tingkat */}
            <ul className="flex flex-col md:hidden">
              {truk.map((item) => (
                <li key={item.id_truk} className="flex gap-4 border-b border-line-soft py-4 first:pt-0 last:border-b-0">
                  <TruckPhoto src={item.foto_truk} alt={`Foto truk ${item.no_polisi}`} className="w-24 flex-none self-start" />
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <Plate value={item.no_polisi} size="sm" />
                    <p className="text-[0.9375rem]">
                      {item.jenis_truk ?? <BelumDiisi />}
                      <span className="text-muted"> · </span>
                      {formatKg(item.kapasitas_muatan) ?? <BelumDiisi />}
                    </p>
                    {aksi(item)}
                  </div>
                </li>
              ))}
            </ul>

            {/* Tablet dan desktop: tabel */}
            <div className="hidden md:block">
              <Table caption="Daftar truk terdaftar">
                <THead>
                  <tr>
                    <TH>Foto</TH>
                    <TH>Nomor plat</TH>
                    <TH>Jenis truk</TH>
                    <TH>Kapasitas muatan</TH>
                    <TH>
                      <span className="sr-only">Aksi</span>
                    </TH>
                  </tr>
                </THead>
                <TBody>
                  {truk.map((item) => (
                    <TR key={item.id_truk} className={editing?.id_truk === item.id_truk ? "bg-subtle" : undefined}>
                      <TD className="h-auto py-3">
                        <TruckPhoto src={item.foto_truk} alt={`Foto truk ${item.no_polisi}`} className="w-28" />
                      </TD>
                      <TD>
                        <Plate value={item.no_polisi} size="sm" />
                      </TD>
                      <TD>{item.jenis_truk ?? <BelumDiisi />}</TD>
                      <TD className="tabular-nums">{formatKg(item.kapasitas_muatan) ?? <BelumDiisi />}</TD>
                      <TD className="text-right">
                        <div className="flex justify-end">{aksi(item)}</div>
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </div>
          </>
        )}
        <p className="mt-5 text-[0.9375rem] text-muted">Truk yang terdaftar dapat dipilih saat memesan slot waktu.</p>
      </Panel>

      <Panel aria-labelledby="judul-form-truk">
        <div id="form-truk" className="scroll-mt-24" />
        <PanelHeader id="judul-form-truk" title={editing ? `Ubah truk ${editing.no_polisi}` : "Tambah truk"} />
        <TrukForm
          key={formKey}
          truk={editing}
          onSaved={selesaiSimpan}
          onCancel={() => {
            setEditing(null);
            setFormKey((key) => key + 1);
          }}
        />
      </Panel>

      <ConfirmDialog
        open={hapus !== null}
        title={hapus ? `Hapus truk ${hapus.no_polisi}?` : "Hapus truk?"}
        confirmLabel="Ya, hapus truk"
        loading={hapusLoading}
        error={hapusError}
        onConfirm={konfirmasiHapus}
        onClose={() => setHapus(null)}
      >
        Truk dan fotonya dihapus dari akun Anda. Truk yang sudah pernah dipakai di pemesanan tidak bisa dihapus.
      </ConfirmDialog>
    </div>
  );
}
