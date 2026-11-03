"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { Button, buttonClass } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { TextField } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Plate } from "@/components/ui/plate";
import { StatusTag } from "@/components/ui/status-tag";
import { TruckPhoto } from "@/components/ui/truck-photo";
import { cn } from "@/lib/cn";
import { formatJamDari, formatKg, formatRentang, formatTanggalJam, formatTanggalPanjang } from "@/lib/format";
import { statusTampil } from "@/lib/pemesanan";
import type { HasilCari } from "@/lib/petugas";

type CheckinBerhasil = {
  kode_booking: string;
  nomor_antrian: string;
  waktu_kedatangan: string;
  estimasi_waktu: string | null;
  truk_di_depan: number;
};

export function VerifikasiView({ nomorAwal }: { nomorAwal: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [cariError, setCariError] = useState<string | null>(null);
  const [mencari, setMencari] = useState(false);
  const [hasil, setHasil] = useState<HasilCari | null>(null);
  const [nomorBerikutnya, setNomorBerikutnya] = useState(nomorAwal);
  const [aksiError, setAksiError] = useState<string | null>(null);
  const [checkinLoading, setCheckinLoading] = useState(false);
  const [berhasil, setBerhasil] = useState<CheckinBerhasil | null>(null);
  const [tidakHadirOpen, setTidakHadirOpen] = useState(false);
  const [tidakHadirLoading, setTidakHadirLoading] = useState(false);
  const [tidakHadirError, setTidakHadirError] = useState<string | null>(null);

  async function cari(q: string) {
    setMencari(true);
    setCariError(null);
    setAksiError(null);
    setBerhasil(null);
    try {
      const response = await fetch(`/api/pemesanan/cari?q=${encodeURIComponent(q)}`, { cache: "no-store" });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setHasil(null);
        setCariError(result.message ?? "Pencarian gagal. Coba lagi.");
        return false;
      }
      setHasil(result.hasil);
      setNomorBerikutnya(result.nomorBerikutnya);
      return true;
    } catch {
      setCariError("Tidak dapat terhubung ke server. Coba lagi.");
      return false;
    } finally {
      setMencari(false);
    }
  }

  async function handleCari(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const q = query.trim();
    if (!q) {
      setHasil(null);
      setCariError("Kode pemesanan atau nomor plat wajib diisi.");
      inputRef.current?.focus();
      return;
    }
    await cari(q);
  }

  async function checkin() {
    if (!hasil) return;
    setCheckinLoading(true);
    setAksiError(null);
    try {
      const response = await fetch("/api/antrian/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_pemesanan: hasil.id_pemesanan }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setAksiError(result.message ?? "Check-in gagal. Coba lagi.");
        return;
      }
      // Muat ulang data pemesanan agar status dan nomor antrian terbaru tampil.
      await cari(hasil.kode_booking);
      setBerhasil(result);
      // Siap untuk truk berikutnya: teks lama terpilih sehingga langsung tertimpa saat mengetik.
      inputRef.current?.focus();
      inputRef.current?.select();
    } catch {
      setAksiError("Tidak dapat terhubung ke server. Coba lagi.");
    } finally {
      setCheckinLoading(false);
    }
  }

  async function tandaiTidakHadir() {
    if (!hasil) return;
    setTidakHadirLoading(true);
    setTidakHadirError(null);
    try {
      const response = await fetch(`/api/pemesanan/${hasil.id_pemesanan}/tidak-hadir`, { method: "POST" });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setTidakHadirError(result.message ?? "Gagal menandai tidak hadir. Coba lagi.");
        return;
      }
      setTidakHadirOpen(false);
      await cari(hasil.kode_booking);
    } catch {
      setTidakHadirError("Tidak dapat terhubung ke server. Coba lagi.");
    } finally {
      setTidakHadirLoading(false);
    }
  }

  function cariLagi() {
    setQuery("");
    setHasil(null);
    setBerhasil(null);
    setCariError(null);
    inputRef.current?.focus();
  }

  const bisaCheckin = hasil?.status_pemesanan === "dipesan" && hasil.hari_ini;
  const bisaTidakHadir = hasil?.status_pemesanan === "dipesan" && (hasil.hari_ini || hasil.sudah_lewat);

  return (
    <div className="flex flex-col gap-6 lg:gap-7">
      <Panel aria-labelledby="judul-cari">
        <PanelHeader id="judul-cari" title="Cari pemesanan" />
        <form onSubmit={handleCari} noValidate className="flex flex-col gap-3">
          <div className="flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-start">
            <TextField
              ref={inputRef}
              label="Kode pemesanan atau nomor plat"
              hideLabel
              name="q"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="BK-20261102-0001 atau B 9123 KXT"
              autoComplete="off"
              autoCapitalize="characters"
              autoFocus
              className="uppercase placeholder:normal-case"
              wrapperClassName="flex-1"
              error={cariError ?? undefined}
            />
            <Button type="submit" variant="dark" loading={mencari} loadingText="Mencari" className="sm:w-28">
              Cari
            </Button>
          </div>
          {!cariError && <p className="text-[0.9375rem] text-muted">Masukkan kode pemesanan dari sopir atau nomor plat truk.</p>}
        </form>
      </Panel>

      {hasil && (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)] lg:gap-7">
          <Panel aria-labelledby="judul-data-pemesanan">
            <div className="mb-5 flex items-start justify-between gap-4">
              <h2 id="judul-data-pemesanan" className="font-display text-[1.5rem] leading-tight font-bold">
                Data pemesanan
              </h2>
              <StatusTag status={statusTampil(hasil)} />
            </div>

            <dl className="flex flex-col">
              <Baris label="Kode pemesanan">
                <span className="font-bold tabular-nums">{hasil.kode_booking}</span>
              </Baris>
              <Baris label="Sopir">
                {hasil.nama_sopir}
                {hasil.no_hp && <span className="text-muted tabular-nums"> · {hasil.no_hp}</span>}
              </Baris>
              <Baris label="Truk">
                <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <Plate value={hasil.no_polisi} size="sm" />
                  <span>{[hasil.jenis_truk, formatKg(hasil.kapasitas_muatan)].filter(Boolean).join(", ") || "Jenis belum diisi"}</span>
                </span>
              </Baris>
              <Baris label="Foto truk">
                <TruckPhoto src={hasil.foto_truk} alt={`Foto truk ${hasil.no_polisi}`} className="w-full max-w-80" />
                {!hasil.foto_truk && <p className="mt-2 text-sm text-muted">Sopir belum mengunggah foto truk ini.</p>}
              </Baris>
              <Baris label="Slot dipesan">
                <span className="tabular-nums">
                  {formatTanggalPanjang(hasil.tanggal)} · {formatRentang(hasil.jam_mulai, hasil.jam_selesai)}
                </span>
                {!hasil.hari_ini && hasil.status_pemesanan === "dipesan" && (
                  <span className="mt-1 block text-sm font-semibold text-error">
                    {hasil.sudah_lewat ? "Tanggal slot sudah lewat." : "Slot ini bukan untuk hari ini."}
                  </span>
                )}
              </Baris>
              {hasil.nomor_antrian && (
                <Baris label="Nomor antrian">
                  <span className="font-display text-lg font-bold">{hasil.nomor_antrian}</span>
                  {hasil.waktu_kedatangan && (
                    <span className="text-muted tabular-nums"> · tiba {formatTanggalJam(hasil.waktu_kedatangan)}</span>
                  )}
                </Baris>
              )}
            </dl>

            <div className="mt-6 flex flex-col gap-4">
              {aksiError && <Notice tone="error">{aksiError}</Notice>}
              {hasil.status_pemesanan === "dipesan" ? (
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button onClick={checkin} disabled={!bisaCheckin} loading={checkinLoading} loadingText="Memproses check-in">
                    Check-in truk
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={!bisaTidakHadir || checkinLoading}
                    onClick={() => {
                      setTidakHadirError(null);
                      setTidakHadirOpen(true);
                    }}
                  >
                    Tandai tidak hadir
                  </Button>
                </div>
              ) : (
                <Notice tone="neutral">
                  {hasil.status_pemesanan === "check-in"
                    ? `Truk ini sudah check-in${hasil.nomor_antrian ? ` dengan nomor antrian ${hasil.nomor_antrian}` : ""}.`
                    : `Pemesanan berstatus ${hasil.status_pemesanan}, jadi tidak bisa di-check-in.`}
                </Notice>
              )}
              {hasil.status_pemesanan === "dipesan" && !hasil.hari_ini && (
                <p className="text-[0.9375rem] text-muted">
                  {hasil.sudah_lewat
                    ? "Check-in hanya bisa untuk slot hari ini. Pemesanan yang lewat tanggal bisa ditandai tidak hadir."
                    : "Check-in dan tanda tidak hadir baru bisa dilakukan pada tanggal slot."}
                </p>
              )}
            </div>
          </Panel>

          <Panel aria-labelledby="judul-setelah-checkin" className={cn(berhasil && "order-first border-selesai lg:order-none")}>
            {berhasil ? (
              <div role="status" className="flex flex-col gap-5">
                <PanelHeader id="judul-setelah-checkin" title="Check-in berhasil" className="mb-0" />
                <div>
                  <p className="text-[0.9375rem] text-steel">Nomor antrian</p>
                  <p className="font-display text-[4.5rem] leading-none font-bold tracking-[-0.02em] tabular-nums">
                    {berhasil.nomor_antrian}
                  </p>
                </div>
                <dl className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm text-muted">Waktu kedatangan</dt>
                    <dd className="text-lg font-bold tabular-nums">{formatJamDari(berhasil.waktu_kedatangan)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted">Estimasi mulai muat</dt>
                    <dd className="text-lg font-bold tabular-nums">
                      {berhasil.estimasi_waktu ? formatJamDari(berhasil.estimasi_waktu) : "Belum dapat dihitung"}
                    </dd>
                  </div>
                </dl>
                <p className="text-[0.9375rem] text-steel">
                  {berhasil.truk_di_depan === 0
                    ? "Tidak ada truk lain yang menunggu. Truk ini bisa langsung dialokasikan."
                    : `${berhasil.truk_di_depan} truk menunggu di depannya.`}
                </p>
                <div className="flex flex-col gap-3">
                  <Button variant="secondary" fullWidth onClick={cariLagi}>
                    Cari pemesanan lain
                  </Button>
                  <Link href="/petugas/monitoring" className={buttonClass("ghost", "md")}>
                    Buka monitoring antrian
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <PanelHeader id="judul-setelah-checkin" title="Setelah check-in" />
                <p className="text-[0.9375rem] text-steel">Sistem akan otomatis:</p>
                <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-5 text-[0.9375rem]">
                  <li>mencatat waktu kedatangan,</li>
                  <li>memberi nomor antrian berikutnya,</li>
                  <li>menghitung estimasi mulai muat.</li>
                </ul>
                <div className="mt-6 border-t border-line pt-5">
                  <p className="text-[0.9375rem] text-steel">Nomor antrian berikutnya</p>
                  <p className="font-display text-[3.5rem] leading-none font-bold tracking-[-0.02em] tabular-nums">
                    {nomorBerikutnya}
                  </p>
                </div>
              </>
            )}
          </Panel>
        </div>
      )}

      <ConfirmDialog
        open={tidakHadirOpen}
        title={hasil ? `Tandai ${hasil.kode_booking} tidak hadir?` : "Tandai tidak hadir?"}
        confirmLabel="Ya, tidak hadir"
        loading={tidakHadirLoading}
        error={tidakHadirError}
        onConfirm={tandaiTidakHadir}
        onClose={() => setTidakHadirOpen(false)}
      >
        {hasil && (
          <>
            Truk {hasil.no_polisi} milik {hasil.nama_sopir} dicatat tidak datang pada slot{" "}
            {formatRentang(hasil.jam_mulai, hasil.jam_selesai)}. Pemesanan ini tidak bisa di-check-in lagi.
          </>
        )}
      </ConfirmDialog>
    </div>
  );
}

function Baris({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-line-soft py-3.5 first:pt-0 sm:grid-cols-[11rem_1fr] sm:gap-4">
      <dt className="text-[0.9375rem] text-muted">{label}</dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  );
}
