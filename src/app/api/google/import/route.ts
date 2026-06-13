import path from "path";
import { isAdmin } from "@/lib/auth";
import { downloadPickedItem, listPickedItems } from "@/lib/google";
import { addPhoto, getAlbumById, id } from "@/lib/store";
import { imageDimensions, savePhotoBytes } from "@/lib/storage";

export async function POST(request: Request) {
  if (!(await isAdmin())) return new Response("Unauthorized", { status: 401 });
  const { sessionId, albumId } = await request.json();
  const album = await getAlbumById(albumId);
  if (!album) return new Response("Album not found", { status: 404 });

  try {
    const items = await listPickedItems(sessionId);
    let imported = 0;
    for (const item of items) {
      if (item.type && item.type !== "PHOTO") continue;
      const bytes = await downloadPickedItem(item);
      const photoId = id();
      const ext = path.extname(item.mediaFile.filename || "") || ".jpg";
      const filename = await savePhotoBytes(photoId, ext, bytes);
      const { width, height } = imageDimensions(bytes);
      await addPhoto(albumId, {
        id: photoId,
        filename,
        width,
        height,
        source: "google-photos",
        createdAt: new Date().toISOString(),
      });
      imported++;
    }
    return Response.json({ imported });
  } catch (err) {
    return new Response(err instanceof Error ? err.message : "Import error", { status: 500 });
  }
}
