import fs from "fs";
import path from "path";
import crypto from "crypto";
import type { Album, Db, Photo } from "./types";
import { r2Enabled, r2GetText, r2Put } from "./r2";

// Metadata store (album list, PINs, photo records). Tiny JSON — stored as a
// single object in the same R2 bucket when configured, otherwise a local
// file for development. Single-admin usage, so whole-document read/modify/
// write is safe (R2 is strongly read-after-write consistent).
const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "db.json");
const DB_KEY = "db.json";

const EMPTY: Db = { albums: [] };

export async function readDb(): Promise<Db> {
  if (r2Enabled()) {
    const text = await r2GetText(DB_KEY);
    return text ? (JSON.parse(text) as Db) : { ...EMPTY };
  }
  // Read path must never write — serverless filesystems are read-only, so
  // creating the data dir here would crash the render. Just read if present.
  try {
    if (!fs.existsSync(DB_PATH)) return { ...EMPTY };
    return JSON.parse(fs.readFileSync(DB_PATH, "utf8")) as Db;
  } catch {
    return { ...EMPTY };
  }
}

export async function writeDb(db: Db): Promise<void> {
  const json = JSON.stringify(db, null, 2);
  if (r2Enabled()) {
    await r2Put(DB_KEY, new TextEncoder().encode(json), "application/json");
    return;
  }
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DB_PATH, json);
}

export function id(): string {
  return crypto.randomBytes(8).toString("hex");
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function listAlbums(kind?: Album["kind"]): Promise<Album[]> {
  const db = await readDb();
  const albums = kind ? db.albums.filter((a) => a.kind === kind) : db.albums;
  return [...albums].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getAlbumBySlug(slug: string): Promise<Album | undefined> {
  return (await readDb()).albums.find((a) => a.slug === slug);
}

export async function getAlbumById(albumId: string): Promise<Album | undefined> {
  return (await readDb()).albums.find((a) => a.id === albumId);
}

export async function createAlbum(input: {
  title: string;
  description: string;
  kind: Album["kind"];
  pin?: string;
}): Promise<Album> {
  const db = await readDb();
  let slug = slugify(input.title) || id();
  if (db.albums.some((a) => a.slug === slug)) slug = `${slug}-${id().slice(0, 4)}`;
  const album: Album = {
    id: id(),
    slug,
    title: input.title,
    description: input.description,
    kind: input.kind,
    pin: input.kind === "client" ? input.pin || Math.floor(1000 + Math.random() * 9000).toString() : undefined,
    featured: false,
    photos: [],
    createdAt: new Date().toISOString(),
  };
  db.albums.push(album);
  await writeDb(db);
  return album;
}

export async function updateAlbum(albumId: string, patch: Partial<Album>): Promise<void> {
  const db = await readDb();
  const album = db.albums.find((a) => a.id === albumId);
  if (!album) return;
  Object.assign(album, patch);
  await writeDb(db);
}

export async function deleteAlbum(albumId: string): Promise<void> {
  const db = await readDb();
  db.albums = db.albums.filter((a) => a.id !== albumId);
  await writeDb(db);
}

export async function addPhoto(albumId: string, photo: Photo): Promise<void> {
  const db = await readDb();
  const album = db.albums.find((a) => a.id === albumId);
  if (!album) return;
  album.photos.push(photo);
  if (!album.coverPhotoId) album.coverPhotoId = photo.id;
  await writeDb(db);
}

export async function removePhoto(albumId: string, photoId: string): Promise<void> {
  const db = await readDb();
  const album = db.albums.find((a) => a.id === albumId);
  if (!album) return;
  album.photos = album.photos.filter((p) => p.id !== photoId);
  if (album.coverPhotoId === photoId) album.coverPhotoId = album.photos[0]?.id;
  await writeDb(db);
}

export async function findPhoto(photoId: string): Promise<Photo | undefined> {
  for (const album of (await readDb()).albums) {
    const p = album.photos.find((ph) => ph.id === photoId);
    if (p) return p;
  }
  return undefined;
}
