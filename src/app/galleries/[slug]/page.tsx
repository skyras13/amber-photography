import { notFound } from "next/navigation";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import GalleryGrid from "@/components/GalleryGrid";
import { getAlbumBySlug } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function AlbumPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const album = getAlbumBySlug(slug);
  if (!album || album.kind !== "public") notFound();

  return (
    <div className="flex-1 flex flex-col">
      <SiteNav />
      <main className="mx-auto max-w-6xl px-6 py-16 w-full flex-1">
        <p className="text-[12px] uppercase tracking-label text-bronze mb-2">Gallery</p>
        <h1 className="font-display text-5xl mb-3">{album.title}</h1>
        {album.description && (
          <p className="text-ink-soft max-w-2xl mb-12">{album.description}</p>
        )}
        <GalleryGrid photos={album.photos} />
      </main>
      <SiteFooter />
    </div>
  );
}
