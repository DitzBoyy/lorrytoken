import { Panel } from "@/components/ui/panel";
import { EmptyState } from "@/components/ui/notice";

/** Isi sementara untuk halaman yang belum dibangun. Dihapus saat halaman dikerjakan di langkah 5. */
export function PagePlaceholder() {
  return (
    <Panel>
      <EmptyState>Isi halaman ini dibangun pada langkah 5.</EmptyState>
    </Panel>
  );
}
