import { NextRequest } from "next/server";
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

export async function GET(request: NextRequest) {
  if (!db) return Response.json({ error: "Database unavailable" }, { status: 503 });
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const search   = searchParams.get("search") || "";
  const page     = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const pageSize = 20;
  const offset   = (page - 1) * pageSize;

  const where  = search ? "WHERE (name LIKE ? OR email LIKE ?)" : "";
  const params = search ? [`%${search}%`, `%${search}%`] : [];

  const total = (db.prepare(`SELECT COUNT(*) as cnt FROM users ${where}`).get(...params) as { cnt: number }).cnt;
  const rows  = db.prepare(
    `SELECT u.id, u.email, u.name, u.plan, u.is_admin, u.created_at,
            (SELECT COUNT(*) FROM conversions c WHERE c.user_id = u.id AND date(c.created_at,'unixepoch') = date('now')) as conversions_today
     FROM users u ${where} ORDER BY u.created_at DESC LIMIT ? OFFSET ?`
  ).all(...params, pageSize, offset);

  return Response.json({ rows, total, page, pageSize });
}

export async function PATCH(request: NextRequest) {
  if (!db) return Response.json({ error: "Database unavailable" }, { status: 503 });
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 403 });

  const { userId, is_admin } = await request.json();
  if (!userId) return Response.json({ error: "userId required" }, { status: 400 });

  db.prepare("UPDATE users SET is_admin = ? WHERE id = ?").run(is_admin ? 1 : 0, userId);
  return Response.json({ success: true });
}
