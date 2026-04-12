import { auth } from "@/auth";
import db from "@/lib/db";

/**
 * Shared admin guard. Returns session if caller is admin, otherwise null.
 */
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || !db) return null;
  const user = db.prepare("SELECT is_admin FROM users WHERE id = ?").get(session.user.id) as
    | { is_admin: number }
    | undefined;
  return user?.is_admin === 1 ? session : null;
}

/**
 * Write to the admin audit log.
 */
export function auditLog(
  adminId: string,
  adminEmail: string,
  action: string,
  targetType: string,
  targetId?: string,
  details?: string,
) {
  if (!db) return;
  db.prepare(
    `INSERT INTO admin_audit_log (admin_id, admin_email, action, target_type, target_id, details)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(adminId, adminEmail, action, targetType, targetId ?? null, details ?? null);
}
