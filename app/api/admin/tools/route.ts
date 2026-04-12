import { NextRequest } from "next/server";
import db from "@/lib/db";
import { requireAdmin, auditLog } from "@/lib/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ALL_TOOLS = [
  { id: "converter",      label: "Image Converter" },
  { id: "compress",       label: "Compress Image" },
  { id: "resize",         label: "Resize Image" },
  { id: "crop",           label: "Crop Image" },
  { id: "convert-to-jpg", label: "Convert to JPG" },
  { id: "photo-editor",   label: "Photo Editor" },
  { id: "enhance",        label: "AI Enhance" },
  { id: "compress-video", label: "Compress Video" },
];

/** List all tools with their enabled/disabled status */
export async function GET() {
  if (!db) return Response.json({ error: "Database unavailable" }, { status: 503 });
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 403 });

  const rows = db.prepare("SELECT tool, disabled, reason, updated_at FROM tool_blocklist").all() as
    { tool: string; disabled: number; reason: string | null; updated_at: string }[];

  const blockMap = new Map(rows.map(r => [r.tool, r]));

  const tools = ALL_TOOLS.map(t => {
    const block = blockMap.get(t.id);
    return {
      id: t.id,
      label: t.label,
      disabled: block?.disabled === 1,
      reason: block?.reason || null,
      updated_at: block?.updated_at || null,
    };
  });

  return Response.json({ tools });
}

/** Toggle a tool on/off */
export async function PATCH(request: NextRequest) {
  if (!db) return Response.json({ error: "Database unavailable" }, { status: 503 });
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 403 });

  const { tool, disabled, reason } = await request.json() as {
    tool: string;
    disabled: boolean;
    reason?: string;
  };

  if (!tool) return Response.json({ error: "tool required" }, { status: 400 });
  if (!ALL_TOOLS.some(t => t.id === tool)) return Response.json({ error: "Unknown tool" }, { status: 400 });

  db.prepare(`
    INSERT INTO tool_blocklist (tool, disabled, reason, updated_at)
    VALUES (?, ?, ?, datetime('now'))
    ON CONFLICT(tool) DO UPDATE SET
      disabled = excluded.disabled,
      reason = excluded.reason,
      updated_at = excluded.updated_at
  `).run(tool, disabled ? 1 : 0, reason ?? null);

  auditLog(
    session.user.id, session.user.email || "unknown",
    disabled ? "disable_tool" : "enable_tool",
    "tool", tool, reason || undefined,
  );

  return Response.json({ success: true, tool, disabled });
}
