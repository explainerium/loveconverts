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

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  if (!db) return Response.json({ error: "Database unavailable" }, { status: 503 });
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 403 });

  const { id } = await ctx.params;
  const row = db.prepare("SELECT * FROM inquiries WHERE id = ?").get(id);
  if (!row) return Response.json({ error: "Not found" }, { status: 404 });

  return Response.json(row);
}

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  if (!db) return Response.json({ error: "Database unavailable" }, { status: 503 });
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 403 });

  const { id } = await ctx.params;
  const body = await request.json();

  const allowedFields = ["status", "priority", "admin_notes"];
  const updates: string[] = [];
  const values: unknown[] = [];

  for (const field of allowedFields) {
    if (field in body) {
      updates.push(`${field} = ?`);
      values.push(body[field]);
    }
  }

  if (updates.length === 0) {
    return Response.json({ error: "No valid fields to update." }, { status: 400 });
  }

  updates.push("updated_at = datetime('now')");
  values.push(id);

  db.prepare(`UPDATE inquiries SET ${updates.join(", ")} WHERE id = ?`).run(...values);

  return Response.json({ success: true });
}
