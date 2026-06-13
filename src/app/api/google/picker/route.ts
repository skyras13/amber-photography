import { isAdmin } from "@/lib/auth";
import { createPickerSession } from "@/lib/google";

export async function POST() {
  if (!(await isAdmin())) return new Response("Unauthorized", { status: 401 });
  try {
    const session = await createPickerSession();
    return Response.json(session);
  } catch (err) {
    return new Response(err instanceof Error ? err.message : "Picker error", { status: 500 });
  }
}
