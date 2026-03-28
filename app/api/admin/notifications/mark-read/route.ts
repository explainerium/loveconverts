import { auth } from "@/auth";
import db from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  if (!db) return null;
  const user = db.prepare("SELECT is_admin FROM users WHERE id = ?").get(session.user.id) as
    | { is_admin: number }
    | undefined;
  return user?.is_admin === 1 ? session : null;
}

export async function PATCH() {
  if (!db) return Response.json({ error: "Database unavailable" }, { status: 503 });
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 403 });

  db.prepare("UPDATE admin_notifications SET is_read = 1 WHERE is_read = 0").run();
  return Response.json({ success: true });
}
