import fs from "fs";
import path from "path";
import { r2Enabled, r2Get, r2Put, r2Delete } from "./r2";

// Photo-file storage. Uses Cloudflare R2 when configured (see r2.ts),
// otherwise falls back to local disk for development.
const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");
const R2_PREFIX = "photos/";

export async function savePhotoBytes(
  photoId: string,
  ext: string,
  bytes: Buffer
): Promise<string> {
  const filename = `${photoId}${ext.startsWith(".") ? ext : "." + ext}`;
  if (r2Enabled()) {
    await r2Put(R2_PREFIX + filename, new Uint8Array(bytes), contentTypeFor(filename));
    return filename;
  }
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  fs.writeFileSync(path.join(UPLOAD_DIR, filename), bytes);
  return filename;
}

export async function readPhotoBytes(
  filename: string
): Promise<{ bytes: Uint8Array<ArrayBuffer>; contentType: string } | null> {
  // filename comes from the db, never from user input, but normalize anyway
  const safe = path.basename(filename);
  if (r2Enabled()) {
    return r2Get(R2_PREFIX + safe);
  }
  const full = path.join(UPLOAD_DIR, safe);
  if (!fs.existsSync(full)) return null;
  return { bytes: new Uint8Array(fs.readFileSync(full)), contentType: contentTypeFor(safe) };
}

export async function deletePhotoBytes(filename: string): Promise<void> {
  const safe = path.basename(filename);
  if (r2Enabled()) {
    await r2Delete(R2_PREFIX + safe);
    return;
  }
  const full = path.join(UPLOAD_DIR, safe);
  if (fs.existsSync(full)) fs.unlinkSync(full);
}

export function contentTypeFor(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  return (
    {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".webp": "image/webp",
      ".gif": "image/gif",
      ".heic": "image/heic",
    }[ext] || "application/octet-stream"
  );
}

// Minimal dimension sniffing for JPEG/PNG/WebP so the gallery can
// reserve layout space without an image-processing dependency.
export function imageDimensions(bytes: Buffer): { width: number; height: number } {
  try {
    if (bytes[0] === 0x89 && bytes[1] === 0x50) {
      // PNG: IHDR starts at byte 16
      return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
    }
    if (bytes[0] === 0xff && bytes[1] === 0xd8) {
      // JPEG: walk markers to SOF
      let i = 2;
      while (i < bytes.length - 9) {
        if (bytes[i] !== 0xff) {
          i++;
          continue;
        }
        const marker = bytes[i + 1];
        if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
          return { height: bytes.readUInt16BE(i + 5), width: bytes.readUInt16BE(i + 7) };
        }
        i += 2 + bytes.readUInt16BE(i + 2);
      }
    }
    if (bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP") {
      const format = bytes.toString("ascii", 12, 16);
      if (format === "VP8 ") return { width: bytes.readUInt16LE(26) & 0x3fff, height: bytes.readUInt16LE(28) & 0x3fff };
      if (format === "VP8L") {
        const b = bytes.readUInt32LE(21);
        return { width: (b & 0x3fff) + 1, height: ((b >> 14) & 0x3fff) + 1 };
      }
      if (format === "VP8X") {
        return {
          width: (bytes.readUIntLE(24, 3) & 0xffffff) + 1,
          height: (bytes.readUIntLE(27, 3) & 0xffffff) + 1,
        };
      }
    }
  } catch {
    // fall through
  }
  return { width: 1600, height: 1067 };
}
