"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import path from "path";
import {
  addPhoto,
  createAlbum,
  deleteAlbum,
  getAlbumById,
  id,
  removePhoto,
  updateAlbum,
} from "@/lib/store";
import { deletePhotoBytes, imageDimensions, savePhotoBytes } from "@/lib/storage";
import { adminPassword, endAdminSession, isAdmin, startAdminSession } from "@/lib/auth";

async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin");
}

export async function loginAction(formData: FormData) {
  const password = String(formData.get("password") || "");
  if (password === adminPassword()) {
    await startAdminSession();
    redirect("/admin");
  }
  redirect("/admin?error=1");
}

export async function logoutAction() {
  await endAdminSession();
  redirect("/admin");
}

export async function createAlbumAction(formData: FormData) {
  await requireAdmin();
  const title = String(formData.get("title") || "").trim();
  if (!title) redirect("/admin");
  const album = await createAlbum({
    title,
    description: String(formData.get("description") || "").trim(),
    kind: formData.get("kind") === "client" ? "client" : "public",
    pin: String(formData.get("pin") || "").trim() || undefined,
  });
  revalidatePath("/admin");
  redirect(`/admin/albums/${album.id}`);
}

export async function updateAlbumAction(formData: FormData) {
  await requireAdmin();
  const albumId = String(formData.get("albumId"));
  await updateAlbum(albumId, {
    title: String(formData.get("title") || "").trim() || undefined,
    description: String(formData.get("description") || "").trim(),
    pin: String(formData.get("pin") || "").trim() || undefined,
    featured: formData.get("featured") === "on",
  });
  revalidatePath("/admin");
  revalidatePath(`/admin/albums/${albumId}`);
}

export async function deleteAlbumAction(formData: FormData) {
  await requireAdmin();
  const albumId = String(formData.get("albumId"));
  const album = await getAlbumById(albumId);
  for (const photo of album?.photos ?? []) await deletePhotoBytes(photo.filename);
  await deleteAlbum(albumId);
  revalidatePath("/admin");
  redirect("/admin");
}

export async function uploadPhotosAction(formData: FormData) {
  await requireAdmin();
  const albumId = String(formData.get("albumId"));
  const files = formData.getAll("photos") as File[];
  for (const file of files) {
    if (!file || typeof file.arrayBuffer !== "function" || file.size === 0) continue;
    const bytes = Buffer.from(await file.arrayBuffer());
    const photoId = id();
    const ext = path.extname(file.name) || ".jpg";
    const filename = await savePhotoBytes(photoId, ext, bytes);
    const { width, height } = imageDimensions(bytes);
    await addPhoto(albumId, {
      id: photoId,
      filename,
      width,
      height,
      source: "upload",
      createdAt: new Date().toISOString(),
    });
  }
  revalidatePath(`/admin/albums/${albumId}`);
}

export async function deletePhotoAction(formData: FormData) {
  await requireAdmin();
  const albumId = String(formData.get("albumId"));
  const photoId = String(formData.get("photoId"));
  const album = await getAlbumById(albumId);
  const photo = album?.photos.find((p) => p.id === photoId);
  if (photo) await deletePhotoBytes(photo.filename);
  await removePhoto(albumId, photoId);
  revalidatePath(`/admin/albums/${albumId}`);
}

export async function setCoverAction(formData: FormData) {
  await requireAdmin();
  const albumId = String(formData.get("albumId"));
  await updateAlbum(albumId, { coverPhotoId: String(formData.get("photoId")) });
  revalidatePath(`/admin/albums/${albumId}`);
}
