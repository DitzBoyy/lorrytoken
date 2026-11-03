import type { Metadata } from "next";
import { requirePageRole } from "@/lib/auth";
import { getMonitoring } from "@/lib/data/petugas";
import { MonitoringView } from "./monitoring-view";

export const metadata: Metadata = { title: "Monitoring Antrian" };

export default async function MonitoringPage() {
  await requirePageRole("petugas");
  const data = await getMonitoring();
  return <MonitoringView initial={data} />;
}
