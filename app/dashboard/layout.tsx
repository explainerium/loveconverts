import { auth } from "@/auth";
import { redirect } from "next/navigation";
import DashboardSidebar from "./DashboardSidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-background">
      <DashboardSidebar
        userName={session.user.name}
        userEmail={session.user.email}
        plan={session.user.plan ?? "free"}
      />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
