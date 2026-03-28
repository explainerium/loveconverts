import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import db from "@/lib/db";
import Link from "next/link";
import EmailTemplateClient from "./EmailTemplateClient";

export const dynamic = "force-dynamic";

interface Inquiry {
  id: string;
  reference_number: string;
  name: string;
  email: string;
  subject: string;
  status: string;
  message: string;
  admin_notes: string | null;
}

export default async function EmailTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const { id } = await params;
  if (!db) notFound();
  const row = db
    .prepare("SELECT id, reference_number, name, email, subject, status, message, admin_notes FROM inquiries WHERE id = ?")
    .get(id) as Inquiry | undefined;
  if (!row) notFound();

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href={`/admin/inquiries/${id}`} className="text-muted hover:text-foreground text-sm transition-colors">
          ← Back to Inquiry
        </Link>
        <span className="text-muted">/</span>
        <span className="text-sm font-semibold text-foreground">Email Template</span>
      </div>

      <div>
        <h1 className="text-2xl font-extrabold text-foreground">Email Reply Template</h1>
        <p className="text-muted text-sm mt-0.5">Preview · No actual email is sent</p>
      </div>

      <EmailTemplateClient inquiry={row} agentName={session.user.name || "Support Team"} />
    </div>
  );
}
