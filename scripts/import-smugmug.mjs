// Imports galleries from Amber's public SmugMug site into the local store.
//
//   node scripts/import-smugmug.mjs              # import the curated demo set
//   node scripts/import-smugmug.mjs --list       # list all galleries on SmugMug
//   node scripts/import-smugmug.mjs --all        # import every gallery (full migration)
//   node scripts/import-smugmug.mjs --limit 10   # cap photos per gallery (default 10, 0 = no cap)
//
// Uses SmugMug's public RSS feeds (no API key needed). Downloads X3-size
// (~1600px) JPEGs. For the final production migration we'd run with --all --limit 0.
import fs from "fs";
import path from "path";
import crypto from "crypto";

const SITE = "https://amberrasmussen.smugmug.com";
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

const ROOT = path.join(import.meta.dirname, "..");
const DATA = path.join(ROOT, "data");
const UPLOADS = path.join(DATA, "uploads");
const DB_PATH = path.join(DATA, "db.json");

// Curated demo set: which SmugMug galleries to import and how to present them.
const DEMO_SET = [
  { match: "Murphy Family", title: "Families", kind: "public", featured: true,
    description: "Golden-hour family sessions — the in-between laughter included." },
  { match: "Jasmine & Jacob Wedding", title: "Weddings", kind: "public",
    description: "Your day, exactly as it felt." },
  { match: "Sanders '25", title: "Lifestyle & Portraits", kind: "public",
    description: "Seniors, headshots, and milestones worth framing." },
  { match: "Weston Baptism", title: "Weston Baptism", kind: "client", pin: "4321",
    description: "Your full gallery is ready! Download your favorites below." },
];

const args = process.argv.slice(2);
const LIST_ONLY = args.includes("--list");
const ALL = args.includes("--all");
const limitIdx = args.indexOf("--limit");
const LIMIT = limitIdx >= 0 ? Number(args[limitIdx + 1]) : 10;

const id = () => crypto.randomBytes(8).toString("hex");
const slugify = (s) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

async function get(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA }, redirect: "follow" });
  if (!res.ok) throw new Error(`${res.status} for ${url}`);
  return res;
}

function decodeEntities(s) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#0?39;/g, "'")
    .replace(/&quot;/g, '"');
}

async function listGalleries() {
  const xml = await (await get(`${SITE}/hack/feed.mg?Type=nickname&Data=amberrasmussen&format=rss200`)).text();
  const items = [...xml.matchAll(/<item>(.*?)<\/item>/gs)];
  return items
    .map(([, it]) => {
      const title = it.match(/<title>(.*?)<\/title>/s)?.[1].trim();
      const link = it.match(/<link>(.*?)<\/link>/s)?.[1].trim();
      return title && link ? { title: decodeEntities(title), link } : null;
    })
    .filter(Boolean);
}

async function galleryPhotos(link) {
  const html = await (await get(link)).text();
  const albumId = html.match(/"albumId":(\d+)/)?.[1];
  const albumKey = html.match(/"albumKey":"([A-Za-z0-9]+)"/)?.[1];
  if (!albumId || !albumKey) throw new Error(`No album key found at ${link}`);
  const xml = await (
    await get(`${SITE}/hack/feed.mg?Type=gallery&Data=${albumId}_${albumKey}&format=rss200`)
  ).text();
  const urls = [
    ...new Set(
      [...xml.matchAll(/img src="(https:\/\/amberrasmussen\.smugmug\.com\/[^"]+)\/Th\/([^"]+)-Th\.jpg"/g)].map(
        ([, base, name]) => `${base}/X3/${name}-X3.jpg`
      )
    ),
  ];
  return urls;
}

// Minimal JPEG dimension sniff (SOF marker walk)
function jpegDimensions(b) {
  let i = 2;
  while (i < b.length - 9) {
    if (b[i] !== 0xff) { i++; continue; }
    const m = b[i + 1];
    if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) {
      return { height: b.readUInt16BE(i + 5), width: b.readUInt16BE(i + 7) };
    }
    i += 2 + b.readUInt16BE(i + 2);
  }
  return { width: 1600, height: 1067 };
}

const galleries = await listGalleries();
if (LIST_ONLY) {
  for (const g of galleries) console.log(`${g.title}  →  ${g.link}`);
  process.exit(0);
}

fs.mkdirSync(UPLOADS, { recursive: true });
const db = fs.existsSync(DB_PATH) ? JSON.parse(fs.readFileSync(DB_PATH, "utf8")) : { albums: [] };

const plan = ALL
  ? galleries.map((g) => ({ match: g.title, title: g.title, kind: "client", description: "" }))
  : DEMO_SET;

for (const spec of plan) {
  const gallery = galleries.find((g) => g.title.includes(spec.match));
  if (!gallery) {
    console.warn(`skip: no gallery matching "${spec.match}"`);
    continue;
  }
  console.log(`Importing "${gallery.title}" as "${spec.title}" (${spec.kind})`);
  let urls = await galleryPhotos(gallery.link);
  if (LIMIT > 0) urls = urls.slice(0, LIMIT);

  const photos = [];
  for (const url of urls) {
    try {
      const bytes = Buffer.from(await (await get(url)).arrayBuffer());
      const photoId = id();
      fs.writeFileSync(path.join(UPLOADS, `${photoId}.jpg`), bytes);
      const { width, height } = jpegDimensions(bytes);
      photos.push({
        id: photoId,
        filename: `${photoId}.jpg`,
        width,
        height,
        source: "upload",
        createdAt: new Date().toISOString(),
      });
      process.stdout.write(".");
    } catch (e) {
      process.stdout.write("x");
    }
  }
  console.log(` ${photos.length} photos`);

  let slug = slugify(spec.title) || id();
  // replace any existing album with the same slug
  const existing = db.albums.find((a) => a.slug === slug);
  if (existing) {
    for (const p of existing.photos) {
      const f = path.join(UPLOADS, p.filename);
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
    db.albums = db.albums.filter((a) => a.slug !== slug);
  }
  db.albums.push({
    id: id(),
    slug,
    title: spec.title,
    description: spec.description || "",
    kind: spec.kind,
    pin: spec.kind === "client" ? spec.pin || "4321" : undefined,
    coverPhotoId: photos[0]?.id,
    featured: Boolean(spec.featured),
    photos,
    createdAt: new Date().toISOString(),
  });
}

fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
console.log(`Done. ${db.albums.length} albums in store.`);
