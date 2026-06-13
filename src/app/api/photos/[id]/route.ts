import { findPhoto } from "@/lib/store";
import { contentTypeFor, readPhotoBytes } from "@/lib/storage";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const photo = findPhoto(id);
  if (!photo) return new Response("Not found", { status: 404 });

  const bytes = readPhotoBytes(photo.filename);
  if (!bytes) return new Response("Not found", { status: 404 });

  const download = new URL(request.url).searchParams.has("download");
  const headers: Record<string, string> = {
    "Content-Type": contentTypeFor(photo.filename),
    "Cache-Control": "public, max-age=31536000, immutable",
  };
  if (download) {
    headers["Content-Disposition"] = `attachment; filename="${photo.filename}"`;
  }
  return new Response(new Uint8Array(bytes), { headers });
}
