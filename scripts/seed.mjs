// Seeds the prototype with sample albums using picsum.photos placeholders.
// Run once: node scripts/seed.mjs
import fs from "fs";
import path from "path";
import crypto from "crypto";

const ROOT = path.join(import.meta.dirname, "..");
const DATA = path.join(ROOT, "data");
const UPLOADS = path.join(DATA, "uploads");
fs.mkdirSync(UPLOADS, { recursive: true });

const id = () => crypto.randomBytes(8).toString("hex");

const ALBUMS = [
  {
    title: "Golden Hour Families",
    slug: "golden-hour-families",
    description: "Sun-soaked evening sessions with the people you love most.",
    kind: "public",
    featured: true,
    seeds: [
      ["fam1", 1600, 1067],
      ["fam2", 1200, 1500],
      ["fam3", 1600, 1067],
      ["fam4", 1200, 1500],
      ["fam5", 1600, 1067],
      ["fam6", 1200, 1500],
    ],
  },
  {
    title: "Senior Portraits",
    slug: "senior-portraits",
    description: "Class of 2026 — portraits as bold as their plans.",
    kind: "public",
    featured: false,
    seeds: [
      ["sen1", 1200, 1500],
      ["sen2", 1600, 1067],
      ["sen3", 1200, 1500],
      ["sen4", 1600, 1067],
      ["sen5", 1200, 1500],
    ],
  },
  {
    title: "Mountain Elopements",
    slug: "mountain-elopements",
    description: "Small weddings, big views.",
    kind: "public",
    featured: false,
    seeds: [
      ["mtn1", 1600, 1067],
      ["mtn2", 1600, 1067],
      ["mtn3", 1200, 1500],
      ["mtn4", 1600, 1067],
      ["mtn5", 1200, 1500],
    ],
  },
  {
    title: "The Hendersons — Fall 2026",
    slug: "hendersons-fall-2026",
    description: "Your full gallery is ready! Download your favorites below.",
    kind: "client",
    pin: "4321",
    featured: false,
    seeds: [
      ["cli1", 1600, 1067],
      ["cli2", 1200, 1500],
      ["cli3", 1600, 1067],
      ["cli4", 1200, 1500],
    ],
  },
];

async function download(seed, w, h) {
  const url = `https://picsum.photos/seed/${seed}/${w}/${h}`;
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

const db = { albums: [] };
for (const album of ALBUMS) {
  const photos = [];
  for (const [seed, w, h] of album.seeds) {
    const photoId = id();
    const bytes = await download(seed, w, h);
    fs.writeFileSync(path.join(UPLOADS, `${photoId}.jpg`), bytes);
    photos.push({
      id: photoId,
      filename: `${photoId}.jpg`,
      width: w,
      height: h,
      source: "seed",
      createdAt: new Date().toISOString(),
    });
    console.log(`  ${album.title}: ${seed} (${w}x${h})`);
  }
  db.albums.push({
    id: id(),
    slug: album.slug,
    title: album.title,
    description: album.description,
    kind: album.kind,
    pin: album.pin,
    coverPhotoId: photos[0]?.id,
    featured: album.featured,
    photos,
    createdAt: new Date().toISOString(),
  });
}

fs.writeFileSync(path.join(DATA, "db.json"), JSON.stringify(db, null, 2));
console.log(`Seeded ${db.albums.length} albums.`);
