import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { exchangeCode } from "@/lib/google";

export async function GET(request: Request) {
  if (!(await isAdmin())) return new Response("Unauthorized", { status: 401 });
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const album = url.searchParams.get("state");
  if (!code) return new Response("Missing authorization code", { status: 400 });
  await exchangeCode(code, url.origin);
  redirect(album ? `/admin/albums/${album}` : "/admin");
}
