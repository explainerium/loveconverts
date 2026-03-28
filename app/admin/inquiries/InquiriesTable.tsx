"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { Search, ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";

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

const PRIORITY_STYLES: Record<string, string> = {
  low:    "bg-gray-100 text-gray-600",
  medium: "bg-blue-50 text-blue-700",
  high:   "bg-orange-50 text-orange-700",
  urgent: "bg-red-50 text-red-700",
};

const STATUS_STYLES: Record<string, string> = {
  open:        "bg-yellow-50 text-yellow-700 border border-yellow-200",
  in_progress: "bg-blue-50 text-blue-700 border border-blue-200",
  resolved:    "bg-green-50 text-green-700 border border-green-200",
  closed:      "bg-gray-100 text-gray-500 border border-gray-200",
};

function timeAgo(dateStr: string) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60)    return "just now";
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function InquiriesTable({
  rows,
  total,
  page,
  totalPages,
  currentFilters,
}: {
  rows: Inquiry[];
  total: number;
  page: number;
  totalPages: number;
  currentFilters: { status: string; priority: string; tool: string; search: string };
}) {
  const router   = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  const [search,   setSearch]   = useState(currentFilters.search);
  const [status,   setStatus]   = useState(currentFilters.status);
  const [priority, setPriority] = useState(currentFilters.priority);
  const [tool,     setTool]     = useState(currentFilters.tool);

  function buildUrl(overrides: Record<string, string | number>) {
    const p = new URLSearchParams();
    const merged = { search, status, priority, tool, page, ...overrides };
    Object.entries(merged).forEach(([k, v]) => { if (v) p.set(k, String(v)); });
    return `${pathname}?${p.toString()}`;
  }

  function applyFilters() {
    startTransition(() => router.push(buildUrl({ page: 1 })));
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-card border border-border rounded-2xl p-4 flex flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search size={14} className="text-muted flex-shrink-0" />
          <input
            type="text"
            placeholder="Search name, email, reference…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyFilters()}
            className="flex-1 text-sm bg-transparent outline-none text-foreground placeholder:text-muted"
          />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)}
          className="px-3 py-1.5 text-sm border border-border rounded-xl bg-background text-foreground">
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        <select value={priority} onChange={(e) => setPriority(e.target.value)}
          className="px-3 py-1.5 text-sm border border-border rounded-xl bg-background text-foreground">
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
        <button
          onClick={applyFilters}
          className="px-4 py-1.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-colors"
        >
          Filter
        </button>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        {rows.length === 0 ? (
          <div className="p-10 text-center text-muted text-sm">No inquiries found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-border">
                <tr>
                  {["Reference", "Customer", "Subject", "Tool", "Priority", "Date", "Status", ""].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-muted uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-bold text-primary whitespace-nowrap">
                      {row.reference_number}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground text-[13px] whitespace-nowrap">{row.name}</p>
                      <p className="text-[11px] text-muted">{row.email}</p>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-foreground max-w-[180px] truncate">{row.subject}</td>
                    <td className="px-4 py-3 text-[12px] text-muted whitespace-nowrap">{row.tool_related || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold capitalize ${PRIORITY_STYLES[row.priority] || "bg-gray-100 text-gray-600"}`}>
                        {row.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-muted whitespace-nowrap">{timeAgo(row.created_at)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize whitespace-nowrap ${STATUS_STYLES[row.status] || ""}`}>
                        {row.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/inquiries/${row.id}`}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary-light text-primary text-xs font-semibold hover:bg-primary hover:text-white transition-colors whitespace-nowrap"
                      >
                        View <ArrowRight size={11} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted">
            Showing {(page - 1) * 15 + 1}–{Math.min(page * 15, total)} of {total}
          </p>
          <div className="flex items-center gap-2">
            <Link
              href={buildUrl({ page: page - 1 })}
              className={`p-1.5 rounded-lg border border-border text-muted transition-colors ${page <= 1 ? "opacity-40 pointer-events-none" : "hover:bg-gray-100"}`}
            >
              <ChevronLeft size={16} />
            </Link>
            <span className="text-sm font-medium text-foreground">{page} / {totalPages}</span>
            <Link
              href={buildUrl({ page: page + 1 })}
              className={`p-1.5 rounded-lg border border-border text-muted transition-colors ${page >= totalPages ? "opacity-40 pointer-events-none" : "hover:bg-gray-100"}`}
            >
              <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
