import Link from "next/link";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import { listAlbums } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function Home() {
  const publicAlbums = (await listAlbums("public")).filter((a) => a.photos.length > 0);
  const hero = publicAlbums.find((a) => a.featured) ?? publicAlbums[0];
  const heroPhoto = hero?.photos.find((p) => p.id === hero.coverPhotoId) ?? hero?.photos[0];

  return (
    <div className="flex-1 flex flex-col">
      <section className="relative h-[92vh] min-h-[540px] bg-ink">
        <SiteNav overlay />
        {heroPhoto && (
          <img
            src={`/api/photos/${heroPhoto.id}`}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-80"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/10 to-black/50" />
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center text-white px-6">
          <p className="fade-up text-[12px] uppercase tracking-label text-white/80 mb-5">
            Weddings · Families · Seniors · Headshots
          </p>
          <h1 className="fade-up font-display text-5xl sm:text-7xl font-light leading-tight max-w-3xl">
            Photographs that feel like the moment itself
          </h1>
          <div className="fade-up-delay mt-10 flex gap-4">
            <Link
              href="/galleries"
              className="border border-white/70 px-8 py-3 text-[12px] uppercase tracking-label hover:bg-white hover:text-ink transition-colors"
            >
              View galleries
            </Link>
            <Link
              href="/contact"
              className="bg-white text-ink px-8 py-3 text-[12px] uppercase tracking-label hover:bg-cream transition-colors"
            >
              Book a session
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-24 w-full">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-[12px] uppercase tracking-label text-bronze mb-2">Portfolio</p>
            <h2 className="font-display text-4xl">Recent work</h2>
          </div>
          <Link
            href="/galleries"
            className="text-[12px] uppercase tracking-label text-ink-soft hover:text-ink"
          >
            All galleries →
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {publicAlbums.slice(0, 6).map((album) => {
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
                <h3 className="font-display text-2xl mt-4">{album.title}</h3>
                <p className="text-sm text-ink-soft mt-1">
                  {album.photos.length} photographs
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="bg-ink text-cream">
        <div className="mx-auto max-w-4xl px-6 py-24 text-center">
          <p className="text-[12px] uppercase tracking-label text-bronze mb-4">For clients</p>
          <h2 className="font-display text-4xl mb-5">Your private gallery</h2>
          <p className="text-cream/70 leading-relaxed max-w-xl mx-auto">
            After your session, your photographs are delivered in a private,
            PIN-protected online gallery where you can view, share, and download
            every image in full resolution.
          </p>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
