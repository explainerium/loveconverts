"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Search, ChevronLeft, ChevronRight, Shield, ShieldOff } from "lucide-react";

interface UserRow {
  id: string;
  email: string;
  name: string | null;
  plan: string;
  is_admin: number;
  created_at: number;
  conversions_today: number;
}

export default function AdminUsersClient({
  rows: initialRows,
  total,
  page,
  totalPages,
  currentSearch,
  currentUserId,
}: {
  rows: UserRow[];
  total: number;
  page: number;
  totalPages: number;
  currentSearch: string;
  currentUserId: string;
}) {
  const router   = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  const [search, setSearch] = useState(currentSearch);
  const [rows,   setRows]   = useState(initialRows);
  const [toggling, setToggling] = useState<string | null>(null);

  function buildUrl(overrides: Record<string, string | number>) {
    const p = new URLSearchParams();
    Object.entries({ search, page, ...overrides }).forEach(([k, v]) => { if (v) p.set(k, String(v)); });
    return `${pathname}?${p.toString()}`;
  }

  function applySearch() {
    startTransition(() => router.push(buildUrl({ page: 1 })));
  }

  async function toggleAdmin(userId: string, currentAdmin: number) {
    if (userId === currentUserId) { alert("You cannot change your own admin status."); return; }
    const newVal = currentAdmin === 1 ? 0 : 1;
    if (!confirm(`${newVal ? "Grant" : "Revoke"} admin access for this user?`)) return;

    setToggling(userId);
    try {
      await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, is_admin: newVal === 1 }),
      });
      setRows((prev) => prev.map((r) => r.id === userId ? { ...r, is_admin: newVal } : r));
    } finally {
      setToggling(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
        <Search size={14} className="text-muted flex-shrink-0" />
        <input
          type="text"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && applySearch()}
          className="flex-1 text-sm bg-transparent outline-none text-foreground placeholder:text-muted"
        />
        <button
          onClick={applySearch}
          className="px-4 py-1.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-colors"
        >
          Search
        </button>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-border">
              <tr>
                {["Name / Email", "Plan", "Convs Today", "Admin", "Joined", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold text-muted uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground text-[13px]">{row.name || "—"}</p>
                    <p className="text-[11px] text-muted">{row.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold capitalize ${
                      row.plan === "pro" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600"
                    }`}>
                      {row.plan}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-foreground text-center">{row.conversions_today}</td>
                  <td className="px-4 py-3">
                    {row.is_admin === 1 ? (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-primary">
                        <Shield size={12} /> Yes
                      </span>
                    ) : (
                      <span className="text-[11px] text-muted">No</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[12px] text-muted whitespace-nowrap">
                    {new Date(row.created_at * 1000).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleAdmin(row.id, row.is_admin)}
                        disabled={toggling === row.id || row.id === currentUserId}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors disabled:opacity-40 ${
                          row.is_admin === 1
                            ? "bg-red-50 text-red-600 hover:bg-red-100"
                            : "bg-primary-light text-primary hover:bg-primary/20"
                        }`}
                      >
                        {row.is_admin === 1 ? <ShieldOff size={11} /> : <Shield size={11} />}
                        {row.is_admin === 1 ? "Revoke" : "Grant"}
                      </button>
                      <Link
                        href={`/dashboard/history?user=${row.id}`}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                      >
                        History
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted">
            {(page - 1) * 20 + 1} to {Math.min(page * 20, total)} of {total}
          </p>
          <div className="flex items-center gap-2">
            <Link href={buildUrl({ page: page - 1 })} className={`p-1.5 rounded-lg border border-border text-muted ${page <= 1 ? "opacity-40 pointer-events-none" : "hover:bg-gray-100"}`}>
              <ChevronLeft size={16} />
            </Link>
            <span className="text-sm font-medium">{page} / {totalPages}</span>
            <Link href={buildUrl({ page: page + 1 })} className={`p-1.5 rounded-lg border border-border text-muted ${page >= totalPages ? "opacity-40 pointer-events-none" : "hover:bg-gray-100"}`}>
              <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
