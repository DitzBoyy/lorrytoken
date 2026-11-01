import type { Metadata } from "next";
import { requirePageRole } from "@/lib/auth";
import { getTrukSopir } from "@/lib/data/truk";
import { DataTrukView } from "./data-truk-view";

export const metadata: Metadata = { title: "Data Truk" };

export default async function DataTrukPage() {
  const user = await requirePageRole("sopir");
  const truk = await getTrukSopir(user.id);
  return <DataTrukView truk={truk} />;
}
