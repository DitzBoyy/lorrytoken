export type Role = "sopir" | "petugas" | "manajemen";

export type NavItem = {
  href: string;
  /** Teks di menu sidebar */
  label: string;
  /** Judul halaman di header */
  title: string;
};

export const ROLE_LABEL: Record<Role, string> = {
  sopir: "Sopir",
  petugas: "Petugas Gudang",
  manajemen: "Pihak Manajemen",
};

/** Halaman awal setelah login (CLAUDE.md bagian 4). */
export const ROLE_HOME: Record<Role, string> = {
  sopir: "/sopir/pemesanan",
  petugas: "/petugas/monitoring",
  manajemen: "/manajemen/dashboard",
};

/** Menu sidebar per role, urutan mengikuti mockup. */
export const NAV: Record<Role, NavItem[]> = {
  sopir: [
    { href: "/sopir/pemesanan", label: "Pemesanan Slot", title: "Pemesanan Slot Waktu" },
    { href: "/sopir/status", label: "Status Antrian", title: "Status Antrian" },
    { href: "/sopir/truk", label: "Data Truk", title: "Data Truk" },
    { href: "/sopir/riwayat", label: "Riwayat Pemesanan", title: "Riwayat Pemesanan" },
  ],
  petugas: [
    { href: "/petugas/monitoring", label: "Monitoring Antrian", title: "Monitoring Antrian" },
    { href: "/petugas/verifikasi", label: "Verifikasi Kedatangan", title: "Verifikasi Kedatangan" },
    { href: "/petugas/kelola", label: "Slot Waktu & Loading Dock", title: "Slot Waktu & Loading Dock" },
  ],
  manajemen: [
    { href: "/manajemen/dashboard", label: "Dashboard Antrian", title: "Dashboard Antrian" },
    { href: "/manajemen/laporan", label: "Laporan", title: "Laporan Antrian" },
    { href: "/manajemen/pengguna", label: "Data Pengguna", title: "Data Pengguna" },
  ],
};

export function findNavItem(role: Role, pathname: string): NavItem | undefined {
  return NAV[role].find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
}
