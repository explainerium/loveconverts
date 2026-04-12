import { NextRequest } from "next/server";
import db from "@/lib/db";
import { requireAdmin, auditLog } from "@/lib/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ platform: string }> }
) {
  if (!db) return Response.json({ error: "Database unavailable" }, { status: 503 });
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 403 });

  const { platform } = await ctx.params;
  const body = await request.json();
  const { disabled, reason } = body as { disabled: boolean; reason?: string };

  // Upsert into blocklist
  db.prepare(`
    INSERT INTO platform_blocklist (platform, disabled, reason, updated_at)
    VALUES (?, ?, ?, datetime('now'))
    ON CONFLICT(platform) DO UPDATE SET
      disabled = excluded.disabled,
      reason = excluded.reason,
      updated_at = excluded.updated_at
  `).run(platform, disabled ? 1 : 0, reason ?? null);

  auditLog(
    session.user.id, session.user.email || "unknown",
    disabled ? "disable_platform" : "enable_platform",
    "downloader", platform, reason || undefined,
  );

  return Response.json({ success: true, platform, disabled });
}
