import { auth } from "@/auth";
import db from "@/lib/db";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";
export const runtime  = "nodejs";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { currentPassword, newPassword } = (await req.json()) as {
    currentPassword?: string;
    newPassword?: string;
  };
  if (!currentPassword || !newPassword) {
    return Response.json({ error: "Both passwords are required" }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return Response.json({ error: "New password must be at least 8 characters" }, { status: 400 });
  }
  if (!db) return Response.json({ error: "Database unavailable" }, { status: 503 });

  const user = db.prepare("SELECT password_hash FROM users WHERE id = ?").get(session.user.id) as
    { password_hash: string | null } | undefined;

  if (!user?.password_hash) {
    return Response.json({ error: "Cannot change password for OAuth accounts" }, { status: 400 });
  }

  const valid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!valid) return Response.json({ error: "Current password is incorrect" }, { status: 400 });

  const hash = await bcrypt.hash(newPassword, 12);
  db.prepare("UPDATE users SET password_hash = ?, updated_at = unixepoch() WHERE id = ?")
    .run(hash, session.user.id);

  return Response.json({ success: true });
}
