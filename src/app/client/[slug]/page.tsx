import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import GalleryGrid from "@/components/GalleryGrid";
import { getAlbumBySlug } from "@/lib/store";
import { grantGalleryAccess, hasGalleryAccess } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ClientGalleryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { slug } = await params;
  const { error } = await searchParams;
  const album = getAlbumBySlug(slug);
  if (!album || album.kind !== "client") notFound();

  const unlocked = await hasGalleryAccess(album.id);

  async function unlock(formData: FormData) {
    "use server";
    const album = getAlbumBySlug(slug);
    if (!album) return;
    const pin = String(formData.get("pin") || "").trim();
    if (pin && pin === album.pin) {
      await grantGalleryAccess(album.id);
      revalidatePath(`/client/${slug}`);
    } else {
      redirect(`/client/${slug}?error=1`);
    }
  }

  if (!unlocked) {
    return (
      <div className="flex-1 flex flex-col">
        <SiteNav />
        <main className="flex-1 flex items-center justify-center px-6 py-24">
          <div className="w-full max-w-sm text-center">
            <p className="text-[12px] uppercase tracking-label text-bronze mb-2">
              Private gallery
            </p>
            <h1 className="font-display text-4xl mb-3">{album.title}</h1>
            <p className="text-ink-soft text-sm mb-8">
              Enter the PIN from your delivery email to view your photographs.
            </p>
            <form action={unlock} className="space-y-4">
              <input
                name="pin"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="••••"
                className="w-full border border-line bg-white px-4 py-3 text-center text-2xl tracking-[0.5em] outline-none focus:border-bronze"
              />
              {error && (
                <p className="text-sm text-red-700">That PIN doesn&apos;t match — try again.</p>
              )}
              <button
                type="submit"
                className="w-full bg-ink text-cream py-3 text-[12px] uppercase tracking-label hover:bg-bronze-dark transition-colors"
              >
                Unlock gallery
              </button>
            </form>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <SiteNav />
      <main className="mx-auto max-w-6xl px-6 py-16 w-full flex-1">
        <div className="flex flex-wrap items-end justify-between gap-6 mb-12">
          <div>
            <p className="text-[12px] uppercase tracking-label text-bronze mb-2">
              Private gallery
            </p>
            <h1 className="font-display text-5xl">{album.title}</h1>
            {album.description && (
              <p className="text-ink-soft max-w-2xl mt-3">{album.description}</p>
            )}
          </div>
          <a
            href={`/api/download/${album.slug}`}
            className="bg-ink text-cream px-8 py-3 text-[12px] uppercase tracking-label hover:bg-bronze-dark transition-colors"
          >
            Download all ({album.photos.length})
          </a>
        </div>
        <GalleryGrid photos={album.photos} downloadable />
      </main>
      <SiteFooter />
    </div>
  );
}
