import fs from "fs";
import path from "path";
import crypto from "crypto";
import type { Album, Db, Photo } from "./types";

// Simple JSON-file store for the prototype. In production this becomes
// Postgres (Neon/Vercel Postgres) behind the same functions.
const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "db.json");

function ensure() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ albums: [] }, null, 2));
  }
}

export function readDb(): Db {
  ensure();
  return JSON.parse(fs.readFileSync(DB_PATH, "utf8")) as Db;
}

export function writeDb(db: Db) {
  ensure();
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
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

export function listAlbums(kind?: Album["kind"]): Album[] {
  const db = readDb();
  const albums = kind ? db.albums.filter((a) => a.kind === kind) : db.albums;
  return [...albums].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getAlbumBySlug(slug: string): Album | undefined {
  return readDb().albums.find((a) => a.slug === slug);
}

export function getAlbumById(albumId: string): Album | undefined {
  return readDb().albums.find((a) => a.id === albumId);
}

export function createAlbum(input: {
  title: string;
  description: string;
  kind: Album["kind"];
  pin?: string;
}): Album {
  const db = readDb();
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
  writeDb(db);
  return album;
}

export function updateAlbum(albumId: string, patch: Partial<Album>) {
  const db = readDb();
  const album = db.albums.find((a) => a.id === albumId);
  if (!album) return;
  Object.assign(album, patch);
  writeDb(db);
}

export function deleteAlbum(albumId: string) {
  const db = readDb();
  db.albums = db.albums.filter((a) => a.id !== albumId);
  writeDb(db);
}

export function addPhoto(albumId: string, photo: Photo) {
  const db = readDb();
  const album = db.albums.find((a) => a.id === albumId);
  if (!album) return;
  album.photos.push(photo);
  if (!album.coverPhotoId) album.coverPhotoId = photo.id;
  writeDb(db);
}

export function removePhoto(albumId: string, photoId: string) {
  const db = readDb();
  const album = db.albums.find((a) => a.id === albumId);
  if (!album) return;
  album.photos = album.photos.filter((p) => p.id !== photoId);
  if (album.coverPhotoId === photoId) album.coverPhotoId = album.photos[0]?.id;
  writeDb(db);
}

export function findPhoto(photoId: string): Photo | undefined {
  for (const album of readDb().albums) {
    const p = album.photos.find((ph) => ph.id === photoId);
    if (p) return p;
  }
  return undefined;
}
