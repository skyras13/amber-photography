import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { authUrl, googleConfigured } from "@/lib/google";

export async function GET(request: Request) {
  if (!(await isAdmin())) return new Response("Unauthorized", { status: 401 });
  if (!googleConfigured()) return new Response("Google API not configured", { status: 400 });
  const url = new URL(request.url);
  const album = url.searchParams.get("album") || "";
  redirect(authUrl(url.origin, album));
}
