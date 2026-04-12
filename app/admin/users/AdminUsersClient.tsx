"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Search, ChevronLeft, ChevronRight, Shield, ShieldOff,
  Crown, Ban, CheckCircle2, Trash2, ArrowUpDown,
} from "lucide-react";

interface UserRow {
  id: string;
  email: string;
  name: string | null;
  plan: string;
  is_admin: number;
  banned: number;
  ban_reason: string | null;
  created_at: number;
  conversions_today: number;
  total_conversions: number;
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
  const [busy, setBusy]     = useState<string | null>(null);

  function buildUrl(overrides: Record<string, string | number>) {
    const p = new URLSearchParams();
    Object.entries({ search, page, ...overrides }).forEach(([k, v]) => { if (v) p.set(k, String(v)); });
    return `${pathname}?${p.toString()}`;
  }

  function applySearch() {
    startTransition(() => router.push(buildUrl({ page: 1 })));
  }

  async function userAction(userId: string, action: string, extra?: Record<string, unknown>) {
    setBusy(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: action === "delete" ? "DELETE" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action, ...extra }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || "Failed"); return; }

      if (action === "delete") {
        setRows(prev => prev.filter(r => r.id !== userId));
      } else {
        setRows(prev => prev.map(r => {
          if (r.id !== userId) return r;
          return { ...r, ...data };
        }));
      }
    } finally {
      setBusy(null);
    }
  }

  function handleToggleAdmin(row: UserRow) {
    if (row.id === currentUserId) { alert("Cannot change your own admin status."); return; }
    const newVal = row.is_admin === 1 ? 0 : 1;
    if (!confirm(`${newVal ? "Grant" : "Revoke"} admin access for ${row.email}?`)) return;
    userAction(row.id, "toggle_admin");
  }

  function handleChangePlan(row: UserRow) {
    const newPlan = row.plan === "pro" ? "free" : "pro";
    if (!confirm(`Change ${row.email} to ${newPlan.toUpperCase()} plan?`)) return;
    userAction(row.id, "change_plan", { plan: newPlan });
  }

  function handleBan(row: UserRow) {
    if (row.banned) {
      if (!confirm(`Unban ${row.email}?`)) return;
      userAction(row.id, "unban");
    } else {
      const reason = prompt(`Ban ${row.email}?\n\nEnter reason (optional):`);
      if (reason === null) return; // cancelled
      userAction(row.id, "ban", { reason });
    }
  }

  function handleDelete(row: UserRow) {
    if (row.id === currentUserId) { alert("Cannot delete yourself."); return; }
    if (!confirm(`PERMANENTLY delete ${row.email} and all their data?\n\nThis cannot be undone!`)) return;
    if (!confirm(`Are you absolutely sure? Type OK to confirm.`)) return;
    userAction(row.id, "delete");
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
        <Search size={14} className="text-muted flex-shrink-0" />
        <input
          type="text"
          placeholder="Search by name or email..."
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
                {["User", "Plan", "Status", "Conversions", "Admin", "Joined", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold text-muted uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row) => (
                <tr key={row.id} className={`hover:bg-gray-50 transition-colors ${row.banned ? "bg-red-50/30" : ""}`}>
                  {/* User */}
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground text-[13px]">{row.name || "—"}</p>
                    <p className="text-[11px] text-muted">{row.email}</p>
                  </td>

                  {/* Plan */}
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold capitalize ${
                      row.plan === "pro" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600"
                    }`}>
                      {row.plan === "pro" && <Crown size={10} />}
                      {row.plan}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    {row.banned ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-700" title={row.ban_reason || undefined}>
                        <Ban size={10} /> Banned
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-green-100 text-green-700">
                        <CheckCircle2 size={10} /> Active
                      </span>
                    )}
                  </td>

                  {/* Conversions */}
                  <td className="px-4 py-3 text-[13px] text-foreground">
                    <span className="font-semibold">{row.conversions_today}</span>
                    <span className="text-muted"> today</span>
                    <span className="text-muted mx-1">/</span>
                    <span className="font-semibold">{row.total_conversions}</span>
                    <span className="text-muted"> total</span>
                  </td>

                  {/* Admin badge */}
                  <td className="px-4 py-3">
                    {row.is_admin === 1 ? (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-primary">
                        <Shield size={12} /> Yes
                      </span>
                    ) : (
                      <span className="text-[11px] text-muted">No</span>
                    )}
                  </td>

                  {/* Joined */}
                  <td className="px-4 py-3 text-[12px] text-muted whitespace-nowrap">
                    {new Date(row.created_at * 1000).toLocaleDateString()}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Plan toggle */}
                      <button
                        onClick={() => handleChangePlan(row)}
                        disabled={busy === row.id}
                        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors disabled:opacity-40 ${
                          row.plan === "pro"
                            ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                        }`}
                        title={row.plan === "pro" ? "Downgrade to Free" : "Upgrade to Pro"}
                      >
                        <ArrowUpDown size={10} />
                        {row.plan === "pro" ? "Free" : "Pro"}
                      </button>

                      {/* Admin toggle */}
                      <button
                        onClick={() => handleToggleAdmin(row)}
                        disabled={busy === row.id || row.id === currentUserId}
                        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors disabled:opacity-40 ${
                          row.is_admin === 1
                            ? "bg-red-50 text-red-600 hover:bg-red-100"
                            : "bg-primary-light text-primary hover:bg-primary/20"
                        }`}
                      >
                        {row.is_admin === 1 ? <ShieldOff size={10} /> : <Shield size={10} />}
                        {row.is_admin === 1 ? "Revoke" : "Admin"}
                      </button>

                      {/* Ban/Unban */}
                      <button
                        onClick={() => handleBan(row)}
                        disabled={busy === row.id || row.id === currentUserId}
                        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors disabled:opacity-40 ${
                          row.banned
                            ? "bg-green-50 text-green-700 hover:bg-green-100"
                            : "bg-orange-50 text-orange-700 hover:bg-orange-100"
                        }`}
                      >
                        <Ban size={10} />
                        {row.banned ? "Unban" : "Ban"}
                      </button>

                      {/* History */}
                      <Link
                        href={`/dashboard/history?user=${row.id}`}
                        className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                      >
                        History
                      </Link>

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(row)}
                        disabled={busy === row.id || row.id === currentUserId}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-40"
                      >
                        <Trash2 size={10} />
                        Delete
                      </button>
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
