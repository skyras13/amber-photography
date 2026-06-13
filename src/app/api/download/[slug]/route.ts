import JSZip from "jszip";
import { getAlbumBySlug } from "@/lib/store";
import { readPhotoBytes } from "@/lib/storage";
import { hasGalleryAccess, isAdmin } from "@/lib/auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const album = getAlbumBySlug(slug);
  if (!album) return new Response("Not found", { status: 404 });

  // Client albums require the gallery PIN cookie (or an admin session)
  if (album.kind === "client") {
    const allowed = (await hasGalleryAccess(album.id)) || (await isAdmin());
    if (!allowed) return new Response("Unauthorized", { status: 401 });
  }

  const zip = new JSZip();
  for (const photo of album.photos) {
    const bytes = readPhotoBytes(photo.filename);
    if (bytes) zip.file(photo.filename, bytes);
  }
  const blob = await zip.generateAsync({ type: "uint8array" });

  return new Response(blob, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${album.slug}.zip"`,
    },
  });
}
