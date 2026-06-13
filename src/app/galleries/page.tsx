import Link from "next/link";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import { listAlbums } from "@/lib/store";

export const dynamic = "force-dynamic";
export const metadata = { title: "Galleries — Amber Rasmussen Photography" };

export default async function GalleriesPage() {
  const albums = (await listAlbums("public")).filter((a) => a.photos.length > 0);
  return (
    <div className="flex-1 flex flex-col">
      <SiteNav />
      <main className="mx-auto max-w-6xl px-6 py-16 w-full flex-1">
        <p className="text-[12px] uppercase tracking-label text-bronze mb-2">Portfolio</p>
        <h1 className="font-display text-5xl mb-12">Galleries</h1>
        {albums.length === 0 ? (
          <p className="text-ink-soft">Galleries are coming soon.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {albums.map((album) => {
              const cover =
                album.photos.find((p) => p.id === album.coverPhotoId) ?? album.photos[0];
              return (
                <Link key={album.id} href={`/galleries/${album.slug}`} className="group block">
                  <div className="overflow-hidden aspect-[4/5] bg-line">
                    <img
                      src={`/api/photos/${cover.id}`}
                      alt={album.title}
                      loading="lazy"
                      className="w-full h-full object-cover photo-hover group-hover:scale-[1.03]"
                    />
                  </div>
                  <h2 className="font-display text-2xl mt-4">{album.title}</h2>
                  {album.description && (
                    <p className="text-sm text-ink-soft mt-1 line-clamp-2">{album.description}</p>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
