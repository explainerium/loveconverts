import { auth } from "@/auth";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import AdminUsersClient from "./AdminUsersClient";

export const dynamic = "force-dynamic";

interface UserRow {
  id: string;
  email: string;
  name: string | null;
  plan: string;
  is_admin: number;
  created_at: number;
  conversions_today: number;
}

interface SearchParams { search?: string; page?: string; }

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const sp     = await searchParams;
  const search = sp.search || "";
  const page   = Math.max(1, parseInt(sp.page || "1"));
  const pageSize = 20;
  const offset   = (page - 1) * pageSize;

  const where  = search ? "WHERE (u.name LIKE ? OR u.email LIKE ?)" : "";
  const params = search ? [`%${search}%`, `%${search}%`] : [];

  if (!db) redirect("/dashboard");

  const total = (db.prepare(`SELECT COUNT(*) as cnt FROM users u ${where}`).get(...params) as { cnt: number }).cnt;
  const rows  = db
    .prepare(
      `SELECT u.id, u.email, u.name, u.plan, u.is_admin, u.created_at,
              (SELECT COUNT(*) FROM conversions c WHERE c.user_id = u.id AND date(c.created_at,'unixepoch') = date('now')) as conversions_today
       FROM users u ${where} ORDER BY u.created_at DESC LIMIT ? OFFSET ?`
    )
    .all(...params, pageSize, offset) as UserRow[];

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">User Management</h1>
        <p className="text-muted text-sm mt-0.5">{total} registered users</p>
      </div>

      <AdminUsersClient
        rows={rows}
        total={total}
        page={page}
        totalPages={totalPages}
        currentSearch={search}
        currentUserId={session.user.id}
      />
    </div>
  );
}
