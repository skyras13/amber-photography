# Amber Rasmussen Photography

A modern photography website with a built-in CMS — replaces SmugMug.

- **Public portfolio** — albums managed from the admin dashboard appear at `/galleries`
- **Private client galleries** — PIN-locked albums at `/client/<slug>` with full-resolution
  single-photo and zip downloads
- **Google Photos import** — pick photos in Google's own picker and they're copied into an
  album (the only Google-sanctioned integration since the March 2025 Library API changes)
- **Admin dashboard** — `/admin` (password: `ADMIN_PASSWORD`, default `amber`)

## Run it

```bash
npm install
node scripts/seed.mjs   # one-time: sample albums with placeholder photos
npm run dev             # http://localhost:3000
```

Try it:

- Portfolio: http://localhost:3000/galleries
- Client gallery: http://localhost:3000/client/hendersons-fall-2026 (PIN `4321`)
- Admin: http://localhost:3000/admin (password `amber`)

## Google Photos setup (~5 minutes)

1. Go to [Google Cloud Console](https://console.cloud.google.com/), create a project.
2. Enable the **Google Photos Picker API** (APIs & Services → Library).
3. Configure the OAuth consent screen (External). Add the photographer's Google account
   as a **test user** — with a single user the app never needs Google verification.
4. Create an **OAuth client ID** (type: Web application) with redirect URI
   `http://localhost:3000/api/google/callback` (add the production URL later).
5. Copy the client ID/secret into `.env.local`:

```
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

Then in any album's admin page: **Connect Google Photos** → **Import from Google Photos**
→ pick photos in the Google tab → they're copied into the album at original quality.

## Architecture notes (prototype → production)

| Prototype (local) | Production |
| --- | --- |
| JSON file db (`data/db.json`) | Postgres (Neon / Vercel Postgres) |
| Local disk uploads (`data/uploads/`) | Vercel Blob or Cloudflare R2 |
| Shared admin password | Same, or upgrade to proper auth |
| `next dev` | Vercel + custom domain |

The data layer (`src/lib/store.ts`) and storage layer (`src/lib/storage.ts`) are small
abstractions specifically so the production swap touches nothing else.
