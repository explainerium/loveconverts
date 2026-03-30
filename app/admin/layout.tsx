import { auth } from "@/auth";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import AdminSidebar from "./AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  if (!db) redirect("/dashboard");

  const uid = session.user.id || session.user.email;
  if (!uid) redirect("/auth/signin");

  const user = db.prepare("SELECT is_admin FROM users WHERE id = ? OR email = ?").get(uid, session.user.email) as
    | { is_admin: number }
    | undefined;

  if (!user || user.is_admin !== 1) redirect("/?error=unauthorized");

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-background">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
