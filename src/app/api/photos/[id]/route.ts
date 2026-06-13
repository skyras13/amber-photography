import { findPhoto } from "@/lib/store";
import { readPhotoBytes } from "@/lib/storage";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const photo = await findPhoto(id);
  if (!photo) return new Response("Not found", { status: 404 });

  const obj = await readPhotoBytes(photo.filename);
  if (!obj) return new Response("Not found", { status: 404 });

  const download = new URL(request.url).searchParams.has("download");
  const headers: Record<string, string> = {
    "Content-Type": obj.contentType,
    "Cache-Control": "public, max-age=31536000, immutable",
  };
  if (download) {
    headers["Content-Disposition"] = `attachment; filename="${photo.filename}"`;
  }
  return new Response(obj.bytes, { headers });
}
