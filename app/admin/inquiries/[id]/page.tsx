import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import db from "@/lib/db";
import Link from "next/link";
import InquiryDetail from "./InquiryDetail";

export const dynamic = "force-dynamic";

interface Inquiry {
  id: string;
  reference_number: string;
  name: string;
  email: string;
  subject: string;
  priority: string;
  tool_related: string | null;
  os_browser: string | null;
  message: string;
  screenshot_base64: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export default async function InquiryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  const { id } = await params;
  if (!db) notFound();

  const row = db.prepare("SELECT * FROM inquiries WHERE id = ?").get(id) as Inquiry | undefined;
  if (!row) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/inquiries" className="text-muted hover:text-foreground text-sm transition-colors">
          ← Inquiries
        </Link>
        <span className="text-muted">/</span>
        <span className="font-mono text-sm font-bold text-primary">{row.reference_number}</span>
        <Link
          href={`/admin/inquiries/${id}/email-template`}
          className="ml-auto px-4 py-1.5 rounded-xl border border-border text-sm font-medium text-muted hover:text-foreground hover:border-primary transition-colors"
        >
          Email Template
        </Link>
      </div>

      <InquiryDetail inquiry={row} />
    </div>
  );
}
