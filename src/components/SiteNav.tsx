import Link from "next/link";

export default function SiteNav({ overlay = false }: { overlay?: boolean }) {
  const linkClass = overlay
    ? "text-white/90 hover:text-white"
    : "text-ink-soft hover:text-ink";
  return (
    <header
      className={
        overlay
          ? "absolute top-0 left-0 right-0 z-20"
          : "border-b border-line bg-cream/90 backdrop-blur sticky top-0 z-20"
      }
    >
      <nav className="mx-auto max-w-6xl px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <Link
          href="/"
          className={`font-display text-2xl tracking-wide whitespace-nowrap ${overlay ? "text-white" : "text-ink"}`}
        >
          Amber Rasmussen
        </Link>
        <div className="flex items-center gap-5 sm:gap-7 text-[13px] uppercase tracking-label">
          <Link className={linkClass} href="/galleries">
            Galleries
          </Link>
          <Link className={linkClass} href="/about">
            About
          </Link>
          <Link className={linkClass} href="/contact">
            Contact
          </Link>
        </div>
      </nav>
    </header>
  );
}
