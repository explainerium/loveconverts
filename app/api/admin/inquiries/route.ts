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
  const status   = searchParams.get("status")   || "";
  const priority = searchParams.get("priority") || "";
  const tool     = searchParams.get("tool")     || "";
  const search   = searchParams.get("search")   || "";
  const page     = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const pageSize = 15;
  const offset   = (page - 1) * pageSize;

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (status)   { conditions.push("status = ?");       params.push(status); }
  if (priority) { conditions.push("priority = ?");     params.push(priority); }
  if (tool)     { conditions.push("tool_related = ?"); params.push(tool); }
  if (search)   {
    conditions.push("(name LIKE ? OR email LIKE ? OR reference_number LIKE ?)");
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const total = (db.prepare(`SELECT COUNT(*) as cnt FROM inquiries ${where}`).get(...params) as { cnt: number }).cnt;
  const rows  = db.prepare(`SELECT id, reference_number, name, email, subject, priority, tool_related, status, created_at FROM inquiries ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
    .all(...params, pageSize, offset);

  return Response.json({ rows, total, page, pageSize });
}
