import { isAdmin } from "@/lib/auth";
import { getPickerSession } from "@/lib/google";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  if (!(await isAdmin())) return new Response("Unauthorized", { status: 401 });
  const { sessionId } = await params;
  try {
    const session = await getPickerSession(sessionId);
    return Response.json(session);
  } catch (err) {
    return new Response(err instanceof Error ? err.message : "Poll error", { status: 500 });
  }
}
