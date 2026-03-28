import { auth } from "@/auth";
import db from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime  = "nodejs";

interface ConversionRow {
  id: string; filename: string; from_format: string; to_format: string;
  tool: string; original_size: number; converted_size: number; created_at: number;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!db) return Response.json({ error: "Database unavailable" }, { status: 503 });

  const rows = db
    .prepare("SELECT * FROM conversions WHERE user_id = ? ORDER BY created_at DESC")
    .all(session.user.id) as ConversionRow[];

  return Response.json({ rows });
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!db) return Response.json({ error: "Database unavailable" }, { status: 503 });

  db.prepare("DELETE FROM conversions WHERE user_id = ?").run(session.user.id);
  return Response.json({ success: true });
}
