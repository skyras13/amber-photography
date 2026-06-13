import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="border-t border-line mt-24">
      <div className="mx-auto max-w-6xl px-6 py-12 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="text-center sm:text-left">
          <p className="font-display text-xl">Amber Rasmussen Photography</p>
          <p className="text-sm text-ink-soft mt-1">
            Capturing the moments that matter.
          </p>
        </div>
        <div className="flex items-center gap-6 text-[12px] uppercase tracking-label text-ink-soft">
          <a
            href="https://www.instagram.com/amberrasphotography/"
            target="_blank"
            rel="noreferrer"
            className="hover:text-ink"
          >
            Instagram
          </a>
          <Link href="/contact" className="hover:text-ink">
            Book a session
          </Link>
          <Link href="/admin" className="hover:text-ink">
            Studio login
          </Link>
        </div>
      </div>
    </footer>
  );
}
