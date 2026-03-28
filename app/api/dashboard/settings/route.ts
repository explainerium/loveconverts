import { auth } from "@/auth";
import db from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime  = "nodejs";

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { name } = (await req.json()) as { name?: string };
  if (!name?.trim()) return Response.json({ error: "Name is required" }, { status: 400 });
  if (!db) return Response.json({ error: "Database unavailable" }, { status: 503 });

  db.prepare("UPDATE users SET name = ?, updated_at = unixepoch() WHERE id = ?")
    .run(name.trim(), session.user.id);

  return Response.json({ success: true });
}
