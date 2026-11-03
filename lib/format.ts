/**
 * Format tampilan tanggal, jam, dan angka dalam Bahasa Indonesia.
 * Nilai dari MySQL datang sebagai string ("2026-11-01", "08:00:00", "2026-11-01 07:52:10")
 * dan diurai sebagai waktu lokal agar tidak bergeser zona waktu.
 */

export function parseTanggal(value: string): Date {
  const [y, m, d] = value.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function parseWaktu(value: string): Date {
  const [datePart, timePart = "00:00:00"] = value.split(" ");
  const [y, m, d] = datePart.split("-").map(Number);
  const [hh, mm, ss] = timePart.split(":").map(Number);
  return new Date(y, m - 1, d, hh, mm, ss || 0);
}

const pad = (n: number) => String(n).padStart(2, "0");

/** "08:00:00" menjadi "08.00" */
export function formatJam(time: string): string {
  return time.slice(0, 5).replace(":", ".");
}

/** "08.00–09.00" (en dash hanya untuk rentang jam) */
export function formatRentang(mulai: string, selesai: string): string {
  return `${formatJam(mulai)}–${formatJam(selesai)}`;
}

/** Jam dari DATETIME atau Date: "07.52" */
export function formatJamDari(value: string | Date): string {
  const date = typeof value === "string" ? parseWaktu(value) : value;
  return `${pad(date.getHours())}.${pad(date.getMinutes())}`;
}

const hariPanjang = new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const tanggalSedang = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" });
const tanggalPendek = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short" });
const hariSingkat = new Intl.DateTimeFormat("id-ID", { weekday: "short" });

/** "Minggu, 1 November 2026" */
export function formatTanggalPanjang(value: string): string {
  return hariPanjang.format(parseTanggal(value));
}

/** "1 Nov 2026" */
export function formatTanggal(value: string): string {
  return tanggalSedang.format(parseTanggal(value));
}

/** Label tab tanggal: "Min 1" */
export function formatTabTanggal(value: string): string {
  const date = parseTanggal(value);
  return `${hariSingkat.format(date)} ${date.getDate()}`;
}

/** "29 Okt, 07.52" */
export function formatTanggalJam(value: string): string {
  const date = parseWaktu(value);
  return `${tanggalPendek.format(date)}, ${formatJamDari(date)}`;
}

const angka = new Intl.NumberFormat("id-ID");

/** "15.000 kg" */
export function formatKg(value: number | null | undefined): string | null {
  return value == null ? null : `${angka.format(value)} kg`;
}

export function formatAngka(value: number): string {
  return angka.format(value);
}

/** Date lokal ke "YYYY-MM-DD" */
export function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Selisih menit antara dua DATETIME (dibulatkan ke bawah, minimal 0). */
export function selisihMenit(dari: string, sampai: string): number {
  return Math.max(0, Math.floor((parseWaktu(sampai).getTime() - parseWaktu(dari).getTime()) / 60000));
}

/** 25 menjadi "25 menit", 95 menjadi "1 jam 35 menit" */
export function formatDurasi(menit: number): string {
  if (menit < 60) return `${menit} menit`;
  if (menit >= 24 * 60) {
    const hari = Math.floor(menit / (24 * 60));
    const sisaJam = Math.floor((menit % (24 * 60)) / 60);
    return sisaJam === 0 ? `${hari} hari` : `${hari} hari ${sisaJam} jam`;
  }
  const jam = Math.floor(menit / 60);
  const sisa = menit % 60;
  return sisa === 0 ? `${jam} jam` : `${jam} jam ${sisa} menit`;
}
