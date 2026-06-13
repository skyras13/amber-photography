import { cookies } from "next/headers";
import crypto from "crypto";

// Prototype admin auth: single shared password (env ADMIN_PASSWORD,
// default "amber") exchanged for a signed cookie.
const SECRET = process.env.SESSION_SECRET || "amber-photography-dev-secret";

function sign(value: string): string {
  return crypto.createHmac("sha256", SECRET).update(value).digest("hex");
}

export function adminPassword(): string {
  return process.env.ADMIN_PASSWORD || "amber";
}

export async function isAdmin(): Promise<boolean> {
  const jar = await cookies();
  const token = jar.get("admin_session")?.value;
  return token === sign("admin");
}

export async function startAdminSession() {
  const jar = await cookies();
  jar.set("admin_session", sign("admin"), {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
}

export async function endAdminSession() {
  const jar = await cookies();
  jar.delete("admin_session");
}

// Client-gallery access: one cookie per unlocked album.
export async function hasGalleryAccess(albumId: string): Promise<boolean> {
  const jar = await cookies();
  return jar.get(`gallery_${albumId}`)?.value === sign(albumId);
}

export async function grantGalleryAccess(albumId: string) {
  const jar = await cookies();
  jar.set(`gallery_${albumId}`, sign(albumId), {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 90,
    path: "/",
  });
}
