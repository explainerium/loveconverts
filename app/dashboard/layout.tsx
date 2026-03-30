import { auth } from "@/auth";
import DashboardSidebar from "./DashboardSidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Proxy already guards /dashboard — if we're here, user should be authenticated.
  // Gracefully handle edge case where session is null (don't redirect — proxy handles it).
  const userName  = session?.user?.name ?? null;
  const userEmail = session?.user?.email ?? "";
  const plan      = session?.user?.plan ?? "free";

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-background">
      <DashboardSidebar
        userName={userName}
        userEmail={userEmail}
        plan={plan}
      />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
