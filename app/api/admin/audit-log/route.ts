import { NextRequest } from "next/server";
import db from "@/lib/db";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!db) return Response.json({ error: "Database unavailable" }, { status: 503 });
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const page     = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const pageSize = 30;
  const offset   = (page - 1) * pageSize;

  const total = (db.prepare("SELECT COUNT(*) as cnt FROM admin_audit_log").get() as { cnt: number }).cnt;
  const rows  = db.prepare(
    `SELECT id, admin_email, action, target_type, target_id, details, created_at
     FROM admin_audit_log ORDER BY created_at DESC LIMIT ? OFFSET ?`
  ).all(pageSize, offset);

  return Response.json({ rows, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
}
