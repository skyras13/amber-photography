import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";

export const metadata = { title: "Contact — Amber Rasmussen Photography" };

export default function ContactPage() {
  return (
    <div className="flex-1 flex flex-col">
      <SiteNav />
      <main className="mx-auto max-w-3xl px-6 py-16 w-full flex-1">
        <p className="text-[12px] uppercase tracking-label text-bronze mb-2">Contact</p>
        <h1 className="font-display text-5xl mb-4">Book a session</h1>
        <p className="text-ink-soft mb-12 max-w-xl">
          Tell me a little about what you have in mind — who it&apos;s for, when
          you&apos;re hoping to shoot, and anything else I should know. I&apos;ll
          get back to you within a couple of days.
        </p>
        <form
          action="mailto:hello@amberrasmussenphotography.com"
          method="post"
          encType="text/plain"
          className="space-y-6"
        >
          <div className="grid sm:grid-cols-2 gap-6">
            <label className="block">
              <span className="text-[12px] uppercase tracking-label text-ink-soft">Name</span>
              <input
                name="name"
                required
                className="mt-2 w-full border border-line bg-white px-4 py-3 outline-none focus:border-bronze"
              />
            </label>
            <label className="block">
              <span className="text-[12px] uppercase tracking-label text-ink-soft">Email</span>
              <input
                name="email"
                type="email"
                required
                className="mt-2 w-full border border-line bg-white px-4 py-3 outline-none focus:border-bronze"
              />
            </label>
          </div>
          <label className="block">
            <span className="text-[12px] uppercase tracking-label text-ink-soft">
              What kind of session?
            </span>
            <input
              name="session"
              placeholder="Family, seniors, couples…"
              className="mt-2 w-full border border-line bg-white px-4 py-3 outline-none focus:border-bronze"
            />
          </label>
          <label className="block">
            <span className="text-[12px] uppercase tracking-label text-ink-soft">Message</span>
            <textarea
              name="message"
              rows={6}
              className="mt-2 w-full border border-line bg-white px-4 py-3 outline-none focus:border-bronze"
            />
          </label>
          <button
            type="submit"
            className="bg-ink text-cream px-10 py-3 text-[12px] uppercase tracking-label hover:bg-bronze-dark transition-colors"
          >
            Send inquiry
          </button>
        </form>
        <p className="text-sm text-ink-soft mt-10">
          Or reach out on{" "}
          <a
            className="underline hover:text-ink"
            href="https://www.instagram.com/amberrasphotography/"
            target="_blank"
            rel="noreferrer"
          >
            Instagram
          </a>
          .
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
