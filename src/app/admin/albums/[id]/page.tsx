import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { getAlbumById } from "@/lib/store";
import { googleConfigured, googleConnected } from "@/lib/google";
import ImportFromGoogle from "@/components/admin/ImportFromGoogle";
import {
  deleteAlbumAction,
  deletePhotoAction,
  setCoverAction,
  updateAlbumAction,
  uploadPhotosAction,
} from "../../actions";

export const dynamic = "force-dynamic";

export default async function AdminAlbumPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await isAdmin())) redirect("/admin");
  const { id } = await params;
  const album = getAlbumById(id);
  if (!album) notFound();

  const shareUrl =
    album.kind === "client" ? `/client/${album.slug}` : `/galleries/${album.slug}`;

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <Link
        href="/admin"
        className="text-[12px] uppercase tracking-label text-ink-soft hover:text-ink"
      >
        ← All albums
      </Link>

      <div className="flex flex-wrap items-end justify-between gap-4 mt-4 mb-10">
        <div>
          <p className="text-[12px] uppercase tracking-label text-bronze mb-1">
            {album.kind === "client" ? "Client album" : "Portfolio album"}
          </p>
          <h1 className="font-display text-4xl">{album.title}</h1>
          <p className="text-sm text-ink-soft mt-2">
            Share link:{" "}
            <a href={shareUrl} target="_blank" className="underline hover:text-ink">
              {shareUrl}
            </a>
            {album.kind === "client" && album.pin && (
              <>
                {" "}
                · PIN <strong>{album.pin}</strong>
              </>
            )}
          </p>
        </div>
        <form action={deleteAlbumAction}>
          <input type="hidden" name="albumId" value={album.id} />
          <button className="text-[12px] uppercase tracking-label text-red-700 hover:text-red-900">
            Delete album
          </button>
        </form>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-12">
        <section className="border border-line bg-white p-6">
          <h2 className="font-display text-2xl mb-4">Details</h2>
          <form action={updateAlbumAction} className="space-y-3">
            <input type="hidden" name="albumId" value={album.id} />
            <input
              name="title"
              defaultValue={album.title}
              className="w-full border border-line px-4 py-2.5 outline-none focus:border-bronze"
            />
            <textarea
              name="description"
              defaultValue={album.description}
              rows={3}
              placeholder="Description"
              className="w-full border border-line px-4 py-2.5 outline-none focus:border-bronze"
            />
            {album.kind === "client" && (
              <input
                name="pin"
                defaultValue={album.pin}
                placeholder="PIN"
                className="w-full border border-line px-4 py-2.5 outline-none focus:border-bronze"
              />
            )}
            {album.kind === "public" && (
              <label className="flex items-center gap-2 text-sm text-ink-soft">
                <input type="checkbox" name="featured" defaultChecked={album.featured} />
                Featured (used for the homepage hero)
              </label>
            )}
            <button className="bg-ink text-cream px-6 py-2.5 text-[12px] uppercase tracking-label hover:bg-bronze-dark transition-colors">
              Save
            </button>
          </form>
        </section>

        <section className="border border-line bg-white p-6">
          <h2 className="font-display text-2xl mb-4">Upload photos</h2>
          <form action={uploadPhotosAction} className="space-y-4">
            <input type="hidden" name="albumId" value={album.id} />
            <input
              type="file"
              name="photos"
              multiple
              accept="image/*"
              className="w-full text-sm file:mr-3 file:border file:border-line file:bg-cream file:px-4 file:py-2 file:text-[12px] file:uppercase file:tracking-label file:cursor-pointer"
            />
            <button className="bg-ink text-cream px-6 py-2.5 text-[12px] uppercase tracking-label hover:bg-bronze-dark transition-colors">
              Upload
            </button>
          </form>
        </section>

        <section className="border border-line bg-white p-6">
          <h2 className="font-display text-2xl mb-4">Import from Google Photos</h2>
          <ImportFromGoogle
            albumId={album.id}
            configured={googleConfigured()}
            connected={googleConnected()}
          />
        </section>
      </div>

      <h2 className="font-display text-2xl mb-5">
        Photos <span className="text-ink-soft text-lg">({album.photos.length})</span>
      </h2>
      {album.photos.length === 0 ? (
        <p className="text-ink-soft text-sm">
          No photos yet — upload some or import from Google Photos.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {album.photos.map((photo) => (
            <div key={photo.id} className="border border-line bg-white">
              <div className="aspect-square bg-line overflow-hidden">
                <img
                  src={`/api/photos/${photo.id}`}
                  alt=""
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex items-center justify-between px-3 py-2 text-[11px] uppercase tracking-label">
                {album.coverPhotoId === photo.id ? (
                  <span className="text-bronze">Cover</span>
                ) : (
                  <form action={setCoverAction}>
                    <input type="hidden" name="albumId" value={album.id} />
                    <input type="hidden" name="photoId" value={photo.id} />
                    <button className="text-ink-soft hover:text-ink">Set cover</button>
                  </form>
                )}
                <form action={deletePhotoAction}>
                  <input type="hidden" name="albumId" value={album.id} />
                  <input type="hidden" name="photoId" value={photo.id} />
                  <button className="text-red-700 hover:text-red-900">Delete</button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
