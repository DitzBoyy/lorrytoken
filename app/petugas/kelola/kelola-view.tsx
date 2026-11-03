"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DateTabs } from "@/components/ui/date-tabs";
import { Dialog } from "@/components/ui/dialog";
import { SelectField, TextField } from "@/components/ui/field";
import { EmptyState, Notice } from "@/components/ui/notice";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { StatusTag } from "@/components/ui/status-tag";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import type { SlotKuota } from "@/lib/data/slot";
import { formatRentang, formatTanggalPanjang, toIsoDate } from "@/lib/format";
import type { Dock } from "@/lib/petugas";
import type { FieldErrors } from "@/lib/validation";

export function KelolaView({
  daftarTanggal,
  tanggal,
  slot,
  dock,
}: {
  daftarTanggal: string[];
  tanggal: string | null;
  slot: SlotKuota[];
  dock: Dock[];
}) {
  const router = useRouter();
  const [editSlot, setEditSlot] = useState<SlotKuota | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [pesan, setPesan] = useState<string | null>(null);
  const [hapus, setHapus] = useState<SlotKuota | null>(null);
  const [hapusLoading, setHapusLoading] = useState(false);
  const [hapusError, setHapusError] = useState<string | null>(null);
  const [dockDialog, setDockDialog] = useState<Dock | "baru" | null>(null);

  function bukaForm(item: SlotKuota | null) {
    setEditSlot(item);
    setPesan(null);
    setFormKey((key) => key + 1);
    requestAnimationFrame(() => {
      const form = document.getElementById("form-slot");
      form?.scrollIntoView({ block: "start" });
      form?.querySelector<HTMLElement>("input, select")?.focus({ preventScroll: true });
    });
  }

  function slotTersimpan(tanggalBaru: string, ubah: boolean) {
    setPesan(ubah ? "Perubahan slot waktu tersimpan." : "Slot waktu tersimpan.");
    setEditSlot(null);
    setFormKey((key) => key + 1);
    if (tanggalBaru !== tanggal) router.replace(`/petugas/kelola?tanggal=${tanggalBaru}`, { scroll: false });
    else router.refresh();
  }

  async function konfirmasiHapus() {
    if (!hapus) return;
    setHapusLoading(true);
    setHapusError(null);
    try {
      const response = await fetch(`/api/slot/${hapus.id_slot}`, { method: "DELETE" });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setHapusError(result.message ?? "Slot gagal dihapus. Coba lagi.");
        return;
      }
      setPesan(`Slot ${formatRentang(hapus.jam_mulai, hapus.jam_selesai)} dihapus.`);
      if (editSlot?.id_slot === hapus.id_slot) setEditSlot(null);
      setHapus(null);
      router.refresh();
    } catch {
      setHapusError("Tidak dapat terhubung ke server. Coba lagi.");
    } finally {
      setHapusLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 lg:gap-7">
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-7">
        <Panel aria-labelledby="judul-slot">
          <div className="mb-5 flex flex-col gap-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 id="judul-slot" className="font-display text-[1.5rem] leading-tight font-bold">
                  Slot waktu
                </h2>
                {tanggal && <p className="mt-1 text-[0.9375rem] text-muted">{formatTanggalPanjang(tanggal)}</p>}
              </div>
              <Button variant="secondary" onClick={() => bukaForm(null)}>
                Tambah slot
              </Button>
            </div>
            {daftarTanggal.length > 0 && <DateTabs hrefBase="/petugas/kelola" tanggal={daftarTanggal} aktif={tanggal} />}
          </div>

          {pesan && (
            <Notice tone="success" className="mb-5">
              {pesan}
            </Notice>
          )}

          {!tanggal ? (
            <EmptyState>Belum ada slot waktu mulai hari ini. Tambahkan slot lewat form Tambah slot waktu.</EmptyState>
          ) : slot.length === 0 ? (
            <EmptyState>Belum ada slot pada tanggal ini.</EmptyState>
          ) : (
            <Table caption={`Slot waktu ${formatTanggalPanjang(tanggal)}`} className="[&_table]:min-w-[31rem]">
              <THead>
                <tr>
                  <TH>Jam</TH>
                  <TH numeric>Kuota</TH>
                  <TH numeric>Terisi</TH>
                  <TH>Status</TH>
                  <TH>
                    <span className="sr-only">Aksi</span>
                  </TH>
                </tr>
              </THead>
              <TBody>
                {slot.map((item) => (
                  <TR key={item.id_slot} className={editSlot?.id_slot === item.id_slot ? "bg-subtle" : undefined}>
                    <TD className="font-semibold tabular-nums">{formatRentang(item.jam_mulai, item.jam_selesai)}</TD>
                    <TD numeric>{item.kuota}</TD>
                    <TD numeric>{item.terpakai}</TD>
                    <TD>
                      <StatusTag status={item.status_slot} />
                    </TD>
                    <TD className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="secondary" onClick={() => bukaForm(item)}>
                          Ubah<span className="sr-only"> slot {formatRentang(item.jam_mulai, item.jam_selesai)}</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={item.terpakai > 0}
                          title={item.terpakai > 0 ? "Slot ini sudah punya pemesanan. Nonaktifkan lewat Ubah." : undefined}
                          onClick={() => {
                            setHapusError(null);
                            setHapus(item);
                          }}
                        >
                          Hapus<span className="sr-only"> slot {formatRentang(item.jam_mulai, item.jam_selesai)}{item.terpakai > 0 ? ", tidak bisa karena sudah ada pemesanan" : ""}</span>
                        </Button>
                      </div>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </Panel>

        <Panel aria-labelledby="judul-dock">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <h2 id="judul-dock" className="font-display text-[1.5rem] leading-tight font-bold">
              Loading dock
            </h2>
            <Button variant="secondary" onClick={() => setDockDialog("baru")}>
              Tambah dock
            </Button>
          </div>
          {dock.length === 0 ? (
            <EmptyState>Belum ada loading dock.</EmptyState>
          ) : (
            <Table caption="Daftar loading dock" className="[&_table]:min-w-[22rem]">
              <THead>
                <tr>
                  <TH>Dock dan keterangan</TH>
                  <TH>Status</TH>
                  <TH>
                    <span className="sr-only">Aksi</span>
                  </TH>
                </tr>
              </THead>
              <TBody>
                {dock.map((item) => (
                  <TR key={item.id_dock}>
                    <TD className="py-3 whitespace-normal!">
                      <span className="block font-semibold">{item.nama_dock}</span>
                      <span className="block text-sm text-muted">{item.keterangan ?? "Tanpa keterangan"}</span>
                    </TD>
                    <TD>
                      <StatusTag status={item.status_dock} />
                    </TD>
                    <TD className="text-right">
                      <Button size="sm" variant="secondary" onClick={() => setDockDialog(item)}>
                        Ubah<span className="sr-only"> {item.nama_dock}</span>
                      </Button>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </Panel>
      </div>

      <Panel aria-labelledby="judul-form-slot" className="max-w-4xl">
        <div id="form-slot" className="scroll-mt-24">
          <PanelHeader
            id="judul-form-slot"
            title={editSlot ? `Ubah slot ${formatRentang(editSlot.jam_mulai, editSlot.jam_selesai)}` : "Tambah slot waktu"}
          />
          <SlotForm
            key={formKey}
            slot={editSlot}
            tanggalAwal={tanggal ?? toIsoDate(new Date())}
            onSaved={slotTersimpan}
            onCancel={() => bukaForm(null)}
          />
        </div>
      </Panel>

      <ConfirmDialog
        open={hapus !== null}
        title={hapus ? `Hapus slot ${formatRentang(hapus.jam_mulai, hapus.jam_selesai)}?` : "Hapus slot?"}
        confirmLabel="Ya, hapus slot"
        loading={hapusLoading}
        error={hapusError}
        onConfirm={konfirmasiHapus}
        onClose={() => setHapus(null)}
      >
        Slot yang sudah punya pemesanan tidak bisa dihapus. Untuk menutupnya, ubah status menjadi nonaktif.
      </ConfirmDialog>

      <Dialog
        open={dockDialog !== null}
        title={dockDialog === "baru" ? "Tambah loading dock" : dockDialog ? `Ubah ${dockDialog.nama_dock}` : "Loading dock"}
        onClose={() => setDockDialog(null)}
      >
        {dockDialog && (
          <DockForm
            dock={dockDialog === "baru" ? null : dockDialog}
            onSaved={() => {
              setDockDialog(null);
              router.refresh();
            }}
            onCancel={() => setDockDialog(null)}
          />
        )}
      </Dialog>
    </div>
  );
}

function SlotForm({
  slot,
  tanggalAwal,
  onSaved,
  onCancel,
}: {
  slot: SlotKuota | null;
  tanggalAwal: string;
  onSaved: (tanggal: string, ubah: boolean) => void;
  onCancel: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>;
    const found: FieldErrors = {};
    if (!data.tanggal) found.tanggal = "Tanggal wajib diisi.";
    if (!data.jam_mulai) found.jam_mulai = "Jam mulai wajib diisi.";
    if (!data.jam_selesai) found.jam_selesai = "Jam selesai wajib diisi.";
    else if (data.jam_mulai && data.jam_selesai <= data.jam_mulai) found.jam_selesai = "Jam selesai harus setelah jam mulai.";
    if (data.kuota === "") found.kuota = "Kuota wajib diisi.";
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setMessage(null);
      const first = ["tanggal", "jam_mulai", "jam_selesai", "kuota"].find((key) => found[key]);
      formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch(slot ? `/api/slot/${slot.id_slot}` : "/api/slot", {
        method: slot ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setErrors(result.errors ?? {});
        setMessage(result.message ?? "Slot gagal disimpan. Coba lagi.");
        setLoading(false);
        return;
      }
      onSaved(result.tanggal, Boolean(slot));
    } catch {
      setMessage("Tidak dapat terhubung ke server. Coba lagi.");
      setLoading(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {message && <Notice tone="error">{message}</Notice>}
      {slot && slot.terpakai > 0 && (
        <Notice tone="neutral">
          Slot ini sudah punya {slot.terpakai} pemesanan. Tanggal dan jam tidak bisa diubah, dan kuota minimal {slot.terpakai}.
        </Notice>
      )}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
        <TextField
          label="Tanggal"
          name="tanggal"
          type="date"
          min={slot ? undefined : toIsoDate(new Date())}
          defaultValue={slot?.tanggal ?? tanggalAwal}
          error={errors.tanggal}
          required
        />
        <TextField
          label="Jam mulai"
          name="jam_mulai"
          type="time"
          step={300}
          defaultValue={slot?.jam_mulai.slice(0, 5) ?? ""}
          error={errors.jam_mulai}
          required
        />
        <TextField
          label="Jam selesai"
          name="jam_selesai"
          type="time"
          step={300}
          defaultValue={slot?.jam_selesai.slice(0, 5) ?? ""}
          error={errors.jam_selesai}
          required
        />
        <TextField
          label="Kuota"
          name="kuota"
          type="number"
          inputMode="numeric"
          min={0}
          max={999}
          defaultValue={slot?.kuota ?? 4}
          error={errors.kuota}
          required
        />
        <SelectField label="Status" name="status_slot" defaultValue={slot?.status_slot ?? "aktif"} error={errors.status_slot}>
          <option value="aktif">Aktif</option>
          <option value="nonaktif">Nonaktif</option>
        </SelectField>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="submit" loading={loading} loadingText="Menyimpan">
          {slot ? "Simpan perubahan" : "Simpan slot"}
        </Button>
        {slot && (
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            Batal ubah
          </Button>
        )}
      </div>
    </form>
  );
}

function DockForm({ dock, onSaved, onCancel }: { dock: Dock | null; onSaved: () => void; onCancel: () => void }) {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const digunakan = dock?.status_dock === "digunakan";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>;
    if (!data.nama_dock?.trim()) {
      setErrors({ nama_dock: "Nama dock wajib diisi." });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch(dock ? `/api/dock/${dock.id_dock}` : "/api/dock", {
        method: dock ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(digunakan ? { ...data, status_dock: "digunakan" } : data),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setErrors(result.errors ?? {});
        setMessage(result.message ?? "Data dock gagal disimpan. Coba lagi.");
        setLoading(false);
        return;
      }
      onSaved();
    } catch {
      setMessage("Tidak dapat terhubung ke server. Coba lagi.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {message && <Notice tone="error">{message}</Notice>}
      <TextField
        label="Nama dock"
        name="nama_dock"
        defaultValue={dock?.nama_dock ?? ""}
        maxLength={50}
        placeholder="Dock 5"
        error={errors.nama_dock}
        required
      />
      {digunakan ? (
        <Notice tone="dimuat">
          Dock ini sedang digunakan. Statusnya kembali tersedia setelah pemuatan ditandai selesai di Monitoring Antrian.
        </Notice>
      ) : (
        <SelectField label="Status" name="status_dock" defaultValue={dock?.status_dock ?? "tersedia"} error={errors.status_dock}>
          <option value="tersedia">Tersedia</option>
          <option value="nonaktif">Nonaktif</option>
        </SelectField>
      )}
      <TextField
        label="Keterangan"
        name="keterangan"
        defaultValue={dock?.keterangan ?? ""}
        maxLength={500}
        hint="Contoh: muatan curah, perbaikan leveler."
        error={errors.keterangan}
      />
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onCancel} disabled={loading}>
          Batal
        </Button>
        <Button type="submit" loading={loading} loadingText="Menyimpan">
          {dock ? "Simpan perubahan" : "Simpan dock"}
        </Button>
      </div>
    </form>
  );
}
