import { NextRequest } from "next/server";
import db from "@/lib/db";
import { requireAdmin, auditLog } from "@/lib/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!db) return Response.json({ error: "Database unavailable" }, { status: 503 });
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const search   = searchParams.get("search") || "";
  const page     = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const pageSize = 20;
  const offset   = (page - 1) * pageSize;

  const where  = search ? "WHERE (u.name LIKE ? OR u.email LIKE ?)" : "";
  const params = search ? [`%${search}%`, `%${search}%`] : [];

  const total = (db.prepare(`SELECT COUNT(*) as cnt FROM users u ${where}`).get(...params) as { cnt: number }).cnt;
  const rows  = db.prepare(
    `SELECT u.id, u.email, u.name, u.plan, u.is_admin, u.banned, u.ban_reason, u.created_at,
            (SELECT COUNT(*) FROM conversions c WHERE c.user_id = u.id AND date(c.created_at,'unixepoch') = date('now')) as conversions_today,
            (SELECT COUNT(*) FROM conversions c2 WHERE c2.user_id = u.id) as total_conversions
     FROM users u ${where} ORDER BY u.created_at DESC LIMIT ? OFFSET ?`
  ).all(...params, pageSize, offset);

  return Response.json({ rows, total, page, pageSize });
}

/** Toggle admin, change plan, ban/unban */
export async function PATCH(request: NextRequest) {
  if (!db) return Response.json({ error: "Database unavailable" }, { status: 503 });
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 403 });

  const body = await request.json();
  const { userId, action } = body as { userId: string; action: string };
  if (!userId || !action) return Response.json({ error: "userId and action required" }, { status: 400 });

  const target = db.prepare("SELECT id, email, name, plan, is_admin, banned FROM users WHERE id = ?").get(userId) as
    | { id: string; email: string; name: string | null; plan: string; is_admin: number; banned: number }
    | undefined;
  if (!target) return Response.json({ error: "User not found" }, { status: 404 });

  const adminId = session.user.id;
  const adminEmail = session.user.email || "unknown";

  switch (action) {
    case "toggle_admin": {
      if (userId === adminId) return Response.json({ error: "Cannot change your own admin status" }, { status: 400 });
      const newVal = target.is_admin === 1 ? 0 : 1;
      db.prepare("UPDATE users SET is_admin = ? WHERE id = ?").run(newVal, userId);
      auditLog(adminId, adminEmail, newVal ? "grant_admin" : "revoke_admin", "user", userId, `User: ${target.email}`);
      return Response.json({ success: true, is_admin: newVal });
    }

    case "change_plan": {
      const { plan } = body as { plan: string };
      if (!["free", "pro"].includes(plan)) return Response.json({ error: "Invalid plan" }, { status: 400 });
      db.prepare("UPDATE users SET plan = ? WHERE id = ?").run(plan, userId);
      auditLog(adminId, adminEmail, `change_plan_to_${plan}`, "user", userId, `User: ${target.email}, from: ${target.plan}`);
      return Response.json({ success: true, plan });
    }

    case "ban": {
      const { reason } = body as { reason?: string };
      db.prepare("UPDATE users SET banned = 1, ban_reason = ? WHERE id = ?").run(reason || null, userId);
      auditLog(adminId, adminEmail, "ban_user", "user", userId, `User: ${target.email}, reason: ${reason || "none"}`);
      return Response.json({ success: true, banned: 1 });
    }

    case "unban": {
      db.prepare("UPDATE users SET banned = 0, ban_reason = NULL WHERE id = ?").run(userId);
      auditLog(adminId, adminEmail, "unban_user", "user", userId, `User: ${target.email}`);
      return Response.json({ success: true, banned: 0 });
    }

    // Backwards compat: old toggle_admin via is_admin field
    default: {
      if ("is_admin" in body) {
        const newVal = body.is_admin ? 1 : 0;
        db.prepare("UPDATE users SET is_admin = ? WHERE id = ?").run(newVal, userId);
        auditLog(adminId, adminEmail, newVal ? "grant_admin" : "revoke_admin", "user", userId, `User: ${target.email}`);
        return Response.json({ success: true });
      }
      return Response.json({ error: "Unknown action" }, { status: 400 });
    }
  }
}

/** Delete a user and all their data */
export async function DELETE(request: NextRequest) {
  if (!db) return Response.json({ error: "Database unavailable" }, { status: 503 });
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 403 });

  const { userId } = await request.json();
  if (!userId) return Response.json({ error: "userId required" }, { status: 400 });

  const adminId = session.user.id;
  if (userId === adminId) return Response.json({ error: "Cannot delete yourself" }, { status: 400 });

  const target = db.prepare("SELECT email, name FROM users WHERE id = ?").get(userId) as
    | { email: string; name: string | null }
    | undefined;
  if (!target) return Response.json({ error: "User not found" }, { status: 404 });

  // CASCADE handles conversions, daily_usage
  db.prepare("DELETE FROM users WHERE id = ?").run(userId);
  auditLog(adminId, session.user.email || "unknown", "delete_user", "user", userId, `Deleted: ${target.email} (${target.name || "no name"})`);

  return Response.json({ success: true });
}
