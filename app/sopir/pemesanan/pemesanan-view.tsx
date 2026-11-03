"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, buttonClass } from "@/components/ui/button";
import { DateTabs } from "@/components/ui/date-tabs";
import { SelectField } from "@/components/ui/field";
import { EmptyState, Notice } from "@/components/ui/notice";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { cn } from "@/lib/cn";
import type { SlotKuota } from "@/lib/data/slot";
import { formatRentang, formatTanggalPanjang } from "@/lib/format";
import { labelTruk, type Truk } from "@/lib/truk";

type Berhasil = { kode: string; rentang: string; tanggal: string };

export function PemesananView({
  daftarTanggal,
  tanggal,
  slot,
  truk,
}: {
  daftarTanggal: string[];
  tanggal: string | null;
  slot: SlotKuota[];
  truk: Truk[];
}) {
  const router = useRouter();
  const [pilihSlot, setPilihSlot] = useState<SlotKuota | null>(null);
  const [idTruk, setIdTruk] = useState("");
  const [trukError, setTrukError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [berhasil, setBerhasil] = useState<Berhasil | null>(null);

  const slotPenuh = pilihSlot !== null && pilihSlot.sisa === 0;

  function pilih(item: SlotKuota) {
    setPilihSlot(item);
    setBerhasil(null);
    setMessage(item.sisa === 0 ? `Slot ${formatRentang(item.jam_mulai, item.jam_selesai)} penuh. Pilih slot waktu lain.` : null);
    // Di bawah lg ringkasan berada di bawah daftar slot: gulir ke sana agar hasil pilihan terlihat.
    if (window.matchMedia("(max-width: 1023px)").matches) {
      requestAnimationFrame(() => document.getElementById("judul-ringkasan")?.scrollIntoView({ block: "start" }));
    }
  }

  async function pesan() {
    if (!pilihSlot) {
      setMessage("Slot waktu wajib dipilih.");
      return;
    }
    if (!idTruk) {
      setTrukError("Truk wajib dipilih.");
      setMessage("Truk wajib dipilih.");
      document.getElementById("pilih-truk")?.focus();
      return;
    }
    if (slotPenuh) return;

    setLoading(true);
    setMessage(null);
    setTrukError(null);
    try {
      const response = await fetch("/api/pemesanan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_slot: pilihSlot.id_slot, id_truk: Number(idTruk) }),
      });
      const result = await response.json().catch(() => ({}));
      setLoading(false);
      if (!response.ok) {
        setMessage(result.message ?? "Pemesanan gagal. Coba lagi.");
        if (result.errors?.id_truk) setTrukError(result.errors.id_truk);
        // Kuota mungkin berubah karena sopir lain: muat ulang angka sisa kuota.
        if (response.status === 409) router.refresh();
        return;
      }
      setBerhasil({
        kode: result.kode_booking,
        rentang: formatRentang(pilihSlot.jam_mulai, pilihSlot.jam_selesai),
        tanggal: pilihSlot.tanggal,
      });
      setPilihSlot(null);
      setIdTruk("");
      router.refresh();
    } catch {
      setLoading(false);
      setMessage("Tidak dapat terhubung ke server. Coba lagi.");
    }
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,26rem)] lg:gap-7">
      <Panel aria-labelledby="judul-pilih-slot">
        <div className="mb-6 flex flex-col gap-4 2xl:flex-row 2xl:items-start 2xl:justify-between">
          <div>
            <h2 id="judul-pilih-slot" className="font-display text-[1.5rem] leading-tight font-bold">
              Pilih slot kedatangan
            </h2>
            {tanggal && (
              <p className="mt-1 text-[0.9375rem] text-muted">
                {formatTanggalPanjang(tanggal)} · kuota dihitung per slot
              </p>
            )}
          </div>
          {daftarTanggal.length > 0 && <DateTabs hrefBase="/sopir/pemesanan" tanggal={daftarTanggal} aktif={tanggal} />}
        </div>

        {!tanggal ? (
          <EmptyState>Belum ada slot waktu yang bisa dipesan. Hubungi petugas gudang.</EmptyState>
        ) : slot.length === 0 ? (
          <EmptyState>Tidak ada slot aktif pada tanggal ini. Pilih tanggal lain.</EmptyState>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 2xl:grid-cols-4">
            {slot.map((item) => (
              <li key={item.id_slot}>
                <SlotCard item={item} selected={pilihSlot?.id_slot === item.id_slot} onSelect={() => pilih(item)} />
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel aria-labelledby="judul-ringkasan">
        <PanelHeader id="judul-ringkasan" title="Ringkasan pemesanan" className="scroll-mt-24" />

        {berhasil ? (
          <div className="flex flex-col gap-5" role="status">
            <div className="rounded-sm bg-selesai-bg px-5 py-4">
              <p className="font-semibold text-selesai">Pemesanan tersimpan</p>
              <p className="mt-1 text-[0.9375rem]">
                {formatTanggalPanjang(berhasil.tanggal)}, slot {berhasil.rentang}
              </p>
            </div>
            <div>
              <p className="text-[0.9375rem] text-steel">Kode pemesanan</p>
              <p className="font-display text-[2.25rem] leading-tight font-bold tracking-[-0.01em] tabular-nums">
                {berhasil.kode}
              </p>
              <p className="mt-1 text-[0.9375rem] text-muted">Tunjukkan kode ini ke petugas saat tiba di gerbang.</p>
            </div>
            <div className="flex flex-col gap-3">
              <Link href={`/sopir/status?kode=${berhasil.kode}`} className={buttonClass("primary", "md", true)}>
                Lihat status antrian
              </Link>
              <Button variant="secondary" fullWidth onClick={() => setBerhasil(null)}>
                Pesan slot lain
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {message && <Notice tone="error">{message}</Notice>}

            <Ringkasan label="Tanggal" value={pilihSlot ? formatTanggalPanjang(pilihSlot.tanggal) : null} />
            <Ringkasan
              label="Slot waktu"
              value={pilihSlot ? formatRentang(pilihSlot.jam_mulai, pilihSlot.jam_selesai) : null}
            />

            {truk.length === 0 ? (
              <Notice tone="info">
                Belum ada truk di akun Anda.{" "}
                <Link href="/sopir/truk" className="font-bold underline underline-offset-4">
                  Tambah truk
                </Link>{" "}
                lebih dulu.
              </Notice>
            ) : (
              <SelectField
                id="pilih-truk"
                label="Truk"
                name="id_truk"
                value={idTruk}
                error={trukError ?? undefined}
                onChange={(event) => {
                  setIdTruk(event.target.value);
                  setTrukError(null);
                  if (message === "Truk wajib dipilih.") setMessage(null);
                }}
              >
                <option value="">Pilih truk</option>
                {truk.map((item) => (
                  <option key={item.id_truk} value={item.id_truk}>
                    {labelTruk(item)}
                  </option>
                ))}
              </SelectField>
            )}

            <Button
              fullWidth
              loading={loading}
              loadingText="Memesan"
              disabled={!pilihSlot || slotPenuh || truk.length === 0}
              onClick={pesan}
              className="h-[3.25rem] text-base"
            >
              Pesan slot
            </Button>
            <p className="text-[0.9375rem] leading-relaxed text-muted">
              {pilihSlot
                ? "Kode pemesanan ditampilkan setelah slot berhasil dipesan. Tunjukkan kode ini ke petugas saat tiba."
                : "Pilih slot waktu di daftar slot untuk mulai memesan."}
            </p>
          </div>
        )}
      </Panel>
    </div>
  );
}

function Ringkasan({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[0.9375rem] text-steel">{label}</p>
      <p
        className={cn(
          "flex min-h-[var(--control-height)] items-center rounded-sm border border-line px-4",
          value ? "bg-panel text-ink" : "bg-subtle text-muted",
        )}
      >
        {value ?? "Belum dipilih"}
      </p>
    </div>
  );
}

/** Kartu slot: rentang jam, bar kuota terpakai, dan sisa kuota. */
function SlotCard({ item, selected, onSelect }: { item: SlotKuota; selected: boolean; onSelect: () => void }) {
  const penuh = item.sisa === 0;
  const redup = penuh || item.lewat;
  const rentang = formatRentang(item.jam_mulai, item.jam_selesai);
  const keterangan = item.lewat ? "Sudah lewat" : penuh ? "Penuh" : `Sisa ${item.sisa} dari ${item.kuota}`;

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={item.lewat}
      aria-pressed={selected}
      aria-label={`Slot ${rentang}, ${keterangan}`}
      className={cn(
        "relative flex w-full flex-col gap-3 overflow-hidden rounded-md border p-4 text-left transition-colors duration-150 sm:p-5",
        "disabled:cursor-not-allowed",
        selected ? "border-ink outline outline-1 outline-ink" : "border-line",
        redup ? "bg-subtle" : "bg-panel hover:border-steel",
      )}
    >
      <span
        className={cn(
          "font-display text-[1.375rem] leading-none font-bold whitespace-nowrap tabular-nums sm:text-[1.5rem]",
          redup ? "text-muted" : "text-ink",
        )}
      >
        {rentang}
      </span>
      <span aria-hidden="true" className="flex gap-1">
        {Array.from({ length: item.kuota }, (_, index) => (
          <span
            key={index}
            className={cn("h-2 flex-1 rounded-xs", index < item.terpakai ? (redup ? "bg-on-ink-muted" : "bg-steel") : "bg-line-soft")}
          />
        ))}
      </span>
      <span
        className={cn(
          "text-[0.9375rem]",
          item.lewat ? "text-muted" : penuh ? "font-semibold text-error" : "text-muted",
        )}
      >
        {keterangan}
      </span>
      {selected && <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1.5 bg-accent" />}
    </button>
  );
}
