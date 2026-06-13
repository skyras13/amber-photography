// One-time migration: push the local data/ store (db.json + uploads/) into
// Cloudflare R2, so production starts with the photos already imported here.
//
//   1. Put your R2 creds in .env.local (R2_ENDPOINT, R2_BUCKET,
//      R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY)
//   2. node --env-file=.env.local scripts/migrate-to-r2.mjs
//
// Idempotent — re-running just re-uploads the same objects.
import fs from "fs";
import path from "path";
import { AwsClient } from "aws4fetch";

const ROOT = path.join(import.meta.dirname, "..");
const DB_PATH = path.join(ROOT, "data", "db.json");
const UPLOAD_DIR = path.join(ROOT, "data", "uploads");

const { R2_ENDPOINT, R2_BUCKET, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY } = process.env;
if (!R2_ENDPOINT || !R2_BUCKET || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
  console.error(
    "Missing R2 env vars. Run with: node --env-file=.env.local scripts/migrate-to-r2.mjs"
  );
  process.exit(1);
}

const client = new AwsClient({
  accessKeyId: R2_ACCESS_KEY_ID,
  secretAccessKey: R2_SECRET_ACCESS_KEY,
  region: "auto",
  service: "s3",
});

function url(key) {
  const safe = key.split("/").map(encodeURIComponent).join("/");
  return `${R2_ENDPOINT}/${R2_BUCKET}/${safe}`;
}

const CONTENT_TYPES = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".heic": "image/heic",
};

async function put(key, bytes, contentType) {
  const res = await client.fetch(url(key), {
    method: "PUT",
    body: bytes,
    headers: contentType ? { "Content-Type": contentType } : undefined,
  });
  if (!res.ok) throw new Error(`PUT ${key} failed: ${res.status} ${await res.text()}`);
}

if (!fs.existsSync(DB_PATH)) {
  console.error(`No local db at ${DB_PATH} — nothing to migrate.`);
  process.exit(1);
}

// 1) photos
let count = 0;
if (fs.existsSync(UPLOAD_DIR)) {
  const files = fs.readdirSync(UPLOAD_DIR).filter((f) => !f.startsWith("."));
  for (const f of files) {
    const bytes = fs.readFileSync(path.join(UPLOAD_DIR, f));
    const ct = CONTENT_TYPES[path.extname(f).toLowerCase()] || "application/octet-stream";
    await put(`photos/${f}`, bytes, ct);
    count++;
    process.stdout.write(".");
  }
}
console.log(`\nUploaded ${count} photos.`);

// 2) the database (do this last so the site never references missing files)
const dbBytes = fs.readFileSync(DB_PATH);
await put("db.json", dbBytes, "application/json");
console.log("Uploaded db.json. Migration complete.");
