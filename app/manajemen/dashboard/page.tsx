import type { Metadata } from "next";
import { requirePageRole } from "@/lib/auth";
import { getDashboard } from "@/lib/data/manajemen";
import { DashboardView } from "./dashboard-view";

export const metadata: Metadata = { title: "Dashboard Antrian" };

export default async function DashboardPage() {
  await requirePageRole("manajemen");
  const data = await getDashboard();
  return <DashboardView initial={data} />;
}
