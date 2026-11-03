"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog } from "@/components/ui/dialog";
import { TextField } from "@/components/ui/field";
import { EmptyState, Notice } from "@/components/ui/notice";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { PasswordField } from "@/components/ui/password-field";
import { Missing, Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { cn } from "@/lib/cn";
import { formatAngka } from "@/lib/format";
import type { Petugas } from "@/lib/manajemen";
import { PASSWORD_MIN, type FieldErrors } from "@/lib/validation";

export function PenggunaView({ petugas }: { petugas: Petugas[] }) {
  const router = useRouter();
  const [form, setForm] = useState<Petugas | "baru" | null>(null);
  const [menyimpan, setMenyimpan] = useState(false);
  const [pesan, setPesan] = useState<string | null>(null);
  const [hapus, setHapus] = useState<Petugas | null>(null);
  const [hapusLoading, setHapusLoading] = useState(false);
  const [hapusError, setHapusError] = useState<string | null>(null);

  function bukaUbah(item: Petugas) {
    setPesan(null);
    setForm(item);
  }

  function bukaHapus(item: Petugas) {
    setHapusError(null);
    setHapus(item);
  }

  async function konfirmasiHapus() {
    if (!hapus) return;
    setHapusLoading(true);
    setHapusError(null);
    try {
      const response = await fetch(`/api/pengguna/${hapus.id_pengguna}`, { method: "DELETE" });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setHapusError(result.message ?? "Akun gagal dihapus. Coba lagi.");
        return;
      }
      setPesan(`Akun ${hapus.nama} dihapus.`);
      setHapus(null);
      router.refresh();
      // Baris yang membuka dialog sudah hilang, jadi fokus dipindah ke tombol Tambah petugas.
      requestAnimationFrame(() => document.getElementById("tambah-petugas")?.focus());
    } catch {
      setHapusError("Tidak dapat terhubung ke server. Coba lagi.");
    } finally {
      setHapusLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 lg:gap-7">
      {pesan && <Notice tone="success">{pesan}</Notice>}

      <Panel aria-labelledby="judul-petugas">
        <PanelHeader
          id="judul-petugas"
          title="Akun petugas gudang"
          aside={
            <Button
              id="tambah-petugas"
              onClick={() => {
                setPesan(null);
                setForm("baru");
              }}
            >
              Tambah petugas
            </Button>
          }
        />
        <p className="-mt-2 mb-5 max-w-[68ch] text-[0.9375rem] text-steel">
          Petugas memakai akun ini untuk masuk ke Verifikasi Kedatangan dan Monitoring Antrian. Akun sopir dibuat sendiri
          oleh sopir lewat halaman Registrasi.
        </p>

        {petugas.length === 0 ? (
          <EmptyState>Belum ada akun petugas. Klik Tambah petugas untuk membuat akun pertama.</EmptyState>
        ) : (
          <>
            {/* Ponsel: daftar bertumpuk agar tombol aksi tidak tersembunyi di luar layar. */}
            <ul className="flex flex-col divide-y divide-line-soft border-y border-line sm:hidden">
              {petugas.map((item) => (
                <li key={item.id_pengguna} className="flex flex-col gap-1 py-4">
                  <p className="font-semibold">{item.nama}</p>
                  <p className="text-[0.9375rem] break-all text-steel">{item.email}</p>
                  <p className="text-[0.9375rem] text-steel tabular-nums">
                    {item.no_hp || "Tanpa nomor HP"} · {formatAngka(item.jumlah_checkin)} check-in dicatat
                  </p>
                  <AksiPetugas item={item} onUbah={() => bukaUbah(item)} onHapus={() => bukaHapus(item)} className="mt-2" />
                </li>
              ))}
            </ul>

            <Table caption="Daftar akun petugas gudang" className="hidden sm:block">
              <THead>
                <tr>
                  <TH>Nama</TH>
                  <TH>Email</TH>
                  <TH>No. HP</TH>
                  <TH numeric>Check-in dicatat</TH>
                  <TH>
                    <span className="sr-only">Aksi</span>
                  </TH>
                </tr>
              </THead>
              <TBody>
                {petugas.map((item) => (
                  <TR key={item.id_pengguna}>
                    <TD className="font-semibold">{item.nama}</TD>
                    <TD>{item.email}</TD>
                    <TD className="tabular-nums">{item.no_hp || <Missing />}</TD>
                    <TD numeric>{formatAngka(item.jumlah_checkin)}</TD>
                    <TD>
                      <AksiPetugas
                        item={item}
                        onUbah={() => bukaUbah(item)}
                        onHapus={() => bukaHapus(item)}
                        className="justify-end"
                      />
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </>
        )}
        {petugas.some((item) => item.jumlah_checkin > 0) && (
          <p className="mt-4 text-sm text-muted">
            Akun yang sudah mencatat check-in tidak bisa dihapus agar riwayat antrian dan laporan tetap utuh.
          </p>
        )}
      </Panel>

      <Dialog
        open={form !== null}
        title={form === "baru" ? "Tambah petugas" : form ? `Ubah akun ${form.nama}` : "Akun petugas"}
        busy={menyimpan}
        onClose={() => setForm(null)}
      >
        {form && (
          <PetugasForm
            petugas={form === "baru" ? null : form}
            onBusy={setMenyimpan}
            onSaved={(nama, baru) => {
              setForm(null);
              setPesan(
                baru
                  ? `Akun petugas ${nama} dibuat. Petugas sudah bisa masuk dengan email dan kata sandi tersebut.`
                  : `Perubahan akun ${nama} tersimpan.`,
              );
              router.refresh();
            }}
            onCancel={() => setForm(null)}
          />
        )}
      </Dialog>

      <ConfirmDialog
        open={hapus !== null}
        title={hapus ? `Hapus akun ${hapus.nama}?` : "Hapus akun?"}
        confirmLabel="Ya, hapus akun"
        loading={hapusLoading}
        error={hapusError}
        onConfirm={konfirmasiHapus}
        onClose={() => setHapus(null)}
      >
        {hapus && <>Akun {hapus.email} tidak bisa dipakai untuk masuk lagi. Tindakan ini tidak bisa dibatalkan.</>}
      </ConfirmDialog>
    </div>
  );
}

/** Tombol Ubah dan Hapus. Akun yang sudah mencatat check-in diberi keterangan, bukan tombol nonaktif. */
function AksiPetugas({
  item,
  onUbah,
  onHapus,
  className,
}: {
  item: Petugas;
  onUbah: () => void;
  onHapus: () => void;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Button size="sm" variant="secondary" onClick={onUbah}>
        Ubah<span className="sr-only"> {item.nama}</span>
      </Button>
      {item.jumlah_checkin > 0 ? (
        <span className="text-sm whitespace-nowrap text-muted">Tidak bisa dihapus</span>
      ) : (
        <Button size="sm" variant="ghost" onClick={onHapus}>
          Hapus<span className="sr-only"> {item.nama}</span>
        </Button>
      )}
    </div>
  );
}

function PetugasForm({
  petugas,
  onSaved,
  onCancel,
  onBusy,
}: {
  petugas: Petugas | null;
  onSaved: (nama: string, baru: boolean) => void;
  onCancel: () => void;
  /** Memberi tahu dialog agar Esc tidak menutupnya saat menyimpan. */
  onBusy: (busy: boolean) => void;
}) {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoadingState] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  function setLoading(value: boolean) {
    setLoadingState(value);
    onBusy(value);
  }

  function fokusKolomSalah() {
    requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>;

    const next: FieldErrors = {};
    if (!data.nama?.trim()) next.nama = "Nama wajib diisi.";
    if (!data.email?.trim()) next.email = "Email wajib diisi.";
    if (!data.no_hp?.trim()) next.no_hp = "Nomor HP wajib diisi.";
    if (!petugas && !data.password) next.password = "Kata sandi wajib diisi.";
    else if (data.password && data.password.length < PASSWORD_MIN) next.password = `Kata sandi minimal ${PASSWORD_MIN} karakter.`;
    if (Object.keys(next).length > 0) {
      setErrors(next);
      setMessage(null);
      fokusKolomSalah();
      return;
    }

    setLoading(true);
    setErrors({});
    setMessage(null);
    try {
      const response = await fetch(petugas ? `/api/pengguna/${petugas.id_pengguna}` : "/api/pengguna", {
        method: petugas ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setErrors(result.errors ?? {});
        setMessage(result.message ?? "Akun gagal disimpan. Coba lagi.");
        setLoading(false);
        fokusKolomSalah();
        return;
      }
      onBusy(false);
      onSaved(data.nama.trim(), !petugas);
    } catch {
      setMessage("Tidak dapat terhubung ke server. Coba lagi.");
      setLoading(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {message && <Notice tone="error">{message}</Notice>}
      <TextField
        label="Nama lengkap"
        name="nama"
        defaultValue={petugas?.nama ?? ""}
        maxLength={100}
        autoComplete="off"
        error={errors.nama}
        required
      />
      <TextField
        label="Email"
        name="email"
        type="email"
        defaultValue={petugas?.email ?? ""}
        maxLength={100}
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
        error={errors.email}
        required
      />
      <TextField
        label="Nomor HP"
        name="no_hp"
        type="tel"
        inputMode="tel"
        defaultValue={petugas?.no_hp ?? ""}
        placeholder="081234567890"
        maxLength={20}
        error={errors.no_hp}
        required
      />
      <PasswordField
        label={petugas ? "Kata sandi baru" : "Kata sandi"}
        name="password"
        autoComplete="new-password"
        hint={
          petugas
            ? "Kosongkan bila kata sandi tidak diganti."
            : `Minimal ${PASSWORD_MIN} karakter. Sampaikan ke petugas secara langsung.`
        }
        error={errors.password}
        required={!petugas}
      />
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onCancel} disabled={loading}>
          Batal
        </Button>
        <Button type="submit" loading={loading} loadingText="Menyimpan">
          {petugas ? "Simpan perubahan" : "Buat akun"}
        </Button>
      </div>
    </form>
  );
}
