import { readFile } from "node:fs/promises";
import path from "node:path";

/**
 * Melayani foto truk dari public/uploads/truk.
 * `next start` hanya melayani file public yang sudah ada saat server dinyalakan, sehingga foto
 * yang diunggah setelahnya akan 404 tanpa route ini. Saat `npm run dev`, file public dilayani langsung.
 */
const FILE_PATTERN = /^[0-9a-f-]{36}\.(jpg|png)$/;

export async function GET(_request: Request, { params }: RouteContext<"/uploads/truk/[file]">) {
  const { file } = await params;
  const match = file.match(FILE_PATTERN);
  if (!match) return new Response("Tidak ditemukan", { status: 404 });

  try {
    const bytes = await readFile(path.join(process.cwd(), "public", "uploads", "truk", file));
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": match[1] === "png" ? "image/png" : "image/jpeg",
        // Nama file unik per unggahan, jadi isinya tidak pernah berubah.
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Tidak ditemukan", { status: 404 });
  }
}
