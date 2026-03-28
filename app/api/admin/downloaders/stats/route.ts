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

export async function GET(_req: NextRequest) {
  if (!db) return Response.json({ error: "Database unavailable" }, { status: 503 });
  const _db = db;
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 403 });

  const platforms = [
    "tiktok", "instagram", "facebook", "twitter",
    "youtube", "youtube-shorts", "pinterest",
    "soundcloud", "vimeo", "dailymotion",
  ];

  const stats = platforms.map(platform => {
    const total = (_db.prepare(
      "SELECT COUNT(*) as c FROM download_stats WHERE platform = ?"
    ).get(platform) as { c: number }).c;

    const successes = (_db.prepare(
      "SELECT COUNT(*) as c FROM download_stats WHERE platform = ? AND success = 1"
    ).get(platform) as { c: number }).c;

    const errors = (_db.prepare(
      "SELECT COUNT(*) as c FROM download_stats WHERE platform = ? AND success = 0"
    ).get(platform) as { c: number }).c;

    const topError = _db.prepare(
      "SELECT error_type, COUNT(*) as c FROM download_stats WHERE platform = ? AND success = 0 AND error_type IS NOT NULL GROUP BY error_type ORDER BY c DESC LIMIT 1"
    ).get(platform) as { error_type: string; c: number } | undefined;

    const blocked = _db.prepare(
      "SELECT disabled FROM platform_blocklist WHERE platform = ?"
    ).get(platform) as { disabled: number } | undefined;

    return {
      platform,
      total,
      successes,
      errors,
      successRate: total > 0 ? Math.round((successes / total) * 100) : null,
      errorRate: total > 0 ? Math.round((errors / total) * 100) : null,
      topError: topError?.error_type ?? null,
      disabled: blocked?.disabled === 1,
      alert: total > 0 && errors / total > 0.5,
    };
  });

  return Response.json({ stats });
}
