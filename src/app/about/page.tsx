import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import { listAlbums } from "@/lib/store";

export const dynamic = "force-dynamic";
export const metadata = { title: "About — Amber Rasmussen Photography" };

export default function AboutPage() {
  const albums = listAlbums("public").filter((a) => a.photos.length > 0);
  const portrait = albums[0]?.photos[1] ?? albums[0]?.photos[0];

  return (
    <div className="flex-1 flex flex-col">
      <SiteNav />
      <main className="mx-auto max-w-6xl px-6 py-16 w-full flex-1">
        <div className="grid md:grid-cols-2 gap-14 items-start">
          <div>
            <p className="text-[12px] uppercase tracking-label text-bronze mb-2">About</p>
            <h1 className="font-display text-5xl mb-8">Hi, I&apos;m Amber.</h1>
            <div className="space-y-5 text-ink-soft leading-relaxed">
              <p>
                Welcome to Amber Rasmussen Photography! I started this business
                from a deep passion to capture those special moments in life.
              </p>
              <p>
                Whether it&apos;s your special day, graduation day, welcoming a
                new baby into the family, or capturing the whole family at this
                season of life — we can make that happen.
              </p>
              <p>
                Call, text, or send me a message and I&apos;ll be happy to get
                you on the books.
              </p>
            </div>
            <a
              href="/contact"
              className="inline-block mt-10 bg-ink text-cream px-8 py-3 text-[12px] uppercase tracking-label hover:bg-bronze-dark transition-colors"
            >
              Let&apos;s work together
            </a>
          </div>
          <div className="aspect-[4/5] bg-line overflow-hidden">
            {portrait && (
              <img
                src={`/api/photos/${portrait.id}`}
                alt="Amber Rasmussen"
                className="w-full h-full object-cover"
              />
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
