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

export async function GET() {
  if (!db) return Response.json({ error: "Database unavailable" }, { status: 503 });
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 403 });

  const totalUsers       = (db.prepare("SELECT COUNT(*) as cnt FROM users").get() as { cnt: number }).cnt;
  const totalConversions = (db.prepare("SELECT COUNT(*) as cnt FROM conversions").get() as { cnt: number }).cnt;
  const openInquiries    = (db.prepare("SELECT COUNT(*) as cnt FROM inquiries WHERE status = 'open'").get() as { cnt: number }).cnt;
  const resolvedInquiries = (db.prepare("SELECT COUNT(*) as cnt FROM inquiries WHERE status = 'resolved'").get() as { cnt: number }).cnt;

  const newUsersThisWeek = (
    db.prepare("SELECT COUNT(*) as cnt FROM users WHERE created_at >= unixepoch('now', '-7 days')").get() as { cnt: number }
  ).cnt;

  const topTools = db
    .prepare("SELECT tool, COUNT(*) as cnt FROM conversions GROUP BY tool ORDER BY cnt DESC LIMIT 10")
    .all() as { tool: string; cnt: number }[];

  const topFormats = db
    .prepare("SELECT from_format, to_format, COUNT(*) as cnt FROM conversions GROUP BY from_format, to_format ORDER BY cnt DESC LIMIT 10")
    .all() as { from_format: string; to_format: string; cnt: number }[];

  const topSubjects = db
    .prepare("SELECT subject, COUNT(*) as cnt FROM inquiries GROUP BY subject ORDER BY cnt DESC LIMIT 10")
    .all() as { subject: string; cnt: number }[];

  return Response.json({
    totalUsers,
    totalConversions,
    openInquiries,
    resolvedInquiries,
    newUsersThisWeek,
    topTools,
    topFormats,
    topSubjects,
  });
}
