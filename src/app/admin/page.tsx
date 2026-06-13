import Link from "next/link";
import { isAdmin } from "@/lib/auth";
import { listAlbums } from "@/lib/store";
import {
  createAlbumAction,
  loginAction,
  logoutAction,
} from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Studio — Amber Rasmussen Photography" };

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  if (!(await isAdmin())) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          <p className="text-[12px] uppercase tracking-label text-bronze mb-2">Studio</p>
          <h1 className="font-display text-4xl mb-8">Sign in</h1>
          <form action={loginAction} className="space-y-4">
            <input
              type="password"
              name="password"
              placeholder="Password"
              autoFocus
              className="w-full border border-line bg-white px-4 py-3 outline-none focus:border-bronze"
            />
            {error && <p className="text-sm text-red-700">Wrong password — try again.</p>}
            <button
              type="submit"
              className="w-full bg-ink text-cream py-3 text-[12px] uppercase tracking-label hover:bg-bronze-dark transition-colors"
            >
              Sign in
            </button>
          </form>
        </div>
      </main>
    );
  }

  const publicAlbums = await listAlbums("public");
  const clientAlbums = await listAlbums("client");

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex items-center justify-between mb-12">
        <div>
          <p className="text-[12px] uppercase tracking-label text-bronze mb-1">Studio</p>
          <h1 className="font-display text-4xl">Albums</h1>
        </div>
        <div className="flex items-center gap-5 text-[12px] uppercase tracking-label">
          <Link href="/" className="text-ink-soft hover:text-ink">
            View site
          </Link>
          <form action={logoutAction}>
            <button className="text-ink-soft hover:text-ink">Sign out</button>
          </form>
        </div>
      </div>

      <section className="mb-14 border border-line bg-white p-6">
        <h2 className="font-display text-2xl mb-5">New album</h2>
        <form action={createAlbumAction} className="grid sm:grid-cols-2 gap-4">
          <input
            name="title"
            required
            placeholder="Album title"
            className="border border-line px-4 py-3 outline-none focus:border-bronze"
          />
          <select name="kind" className="border border-line px-4 py-3 bg-white outline-none">
            <option value="public">Public — shows in portfolio</option>
            <option value="client">Client — private, PIN-locked</option>
          </select>
          <input
            name="description"
            placeholder="Short description (optional)"
            className="border border-line px-4 py-3 outline-none focus:border-bronze sm:col-span-2"
          />
          <input
            name="pin"
            placeholder="PIN for client albums (auto-generated if blank)"
            className="border border-line px-4 py-3 outline-none focus:border-bronze"
          />
          <button className="bg-ink text-cream py-3 text-[12px] uppercase tracking-label hover:bg-bronze-dark transition-colors">
            Create album
          </button>
        </form>
      </section>

      {[
        { label: "Portfolio albums", albums: publicAlbums },
        { label: "Client albums", albums: clientAlbums },
      ].map(({ label, albums }) => (
        <section key={label} className="mb-12">
          <h2 className="font-display text-2xl mb-5">{label}</h2>
          {albums.length === 0 ? (
            <p className="text-ink-soft text-sm">None yet.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {albums.map((album) => {
                const cover =
                  album.photos.find((p) => p.id === album.coverPhotoId) ?? album.photos[0];
                return (
                  <Link
                    key={album.id}
                    href={`/admin/albums/${album.id}`}
                    className="group border border-line bg-white hover:border-bronze transition-colors"
                  >
                    <div className="aspect-[4/3] bg-line overflow-hidden">
                      {cover && (
                        <img
                          src={`/api/photos/${cover.id}`}
                          alt=""
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-display text-xl">{album.title}</h3>
                      <p className="text-sm text-ink-soft mt-1">
                        {album.photos.length} photos
                        {album.kind === "client" && album.pin && ` · PIN ${album.pin}`}
                        {album.featured && " · Featured"}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      ))}
    </main>
  );
}
