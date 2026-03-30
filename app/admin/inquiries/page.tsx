import { auth } from "@/auth";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import Link from "next/link";
import InquiriesTable from "./InquiriesTable";

export const dynamic = "force-dynamic";

interface Inquiry {
  id: string;
  reference_number: string;
  name: string;
  email: string;
  subject: string;
  tool_related: string | null;
  priority: string;
  status: string;
  created_at: string;
}

interface SearchParams {
  status?: string;
  priority?: string;
  tool?: string;
  search?: string;
  page?: string;
}

export default async function AdminInquiriesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  const sp     = await searchParams;
  const status   = sp.status   || "";
  const priority = sp.priority || "";
  const tool     = sp.tool     || "";
  const search   = sp.search   || "";
  const page     = Math.max(1, parseInt(sp.page || "1"));
  const pageSize = 15;
  const offset   = (page - 1) * pageSize;

  const conditions: string[] = [];
  const params: unknown[]    = [];

  if (status)   { conditions.push("status = ?");       params.push(status);   }
  if (priority) { conditions.push("priority = ?");     params.push(priority); }
  if (tool)     { conditions.push("tool_related = ?"); params.push(tool);     }
  if (search)   {
    conditions.push("(name LIKE ? OR email LIKE ? OR reference_number LIKE ?)");
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  if (!db) redirect("/dashboard");

  const total = (db.prepare(`SELECT COUNT(*) as cnt FROM inquiries ${where}`).get(...params) as { cnt: number }).cnt;
  const rows  = db
    .prepare(
      `SELECT id, reference_number, name, email, subject, tool_related, priority, status, created_at
       FROM inquiries ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`
    )
    .all(...params, pageSize, offset) as Inquiry[];

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">Customer Inquiries</h1>
          <p className="text-muted text-sm mt-0.5">{total} total inquiries</p>
        </div>
        <Link
          href="/support"
          className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-colors"
        >
          View Support Page
        </Link>
      </div>

      <InquiriesTable
        rows={rows}
        total={total}
        page={page}
        totalPages={totalPages}
        currentFilters={{ status, priority, tool, search }}
      />
    </div>
  );
}
