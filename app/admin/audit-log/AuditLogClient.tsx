"use client";

import { useState, useEffect } from "react";
import {
  Loader2, ChevronLeft, ChevronRight,
  Shield, ShieldOff, Ban, CheckCircle2, Trash2,
  Power, PowerOff, Crown, ArrowUpDown, Download,
} from "lucide-react";

interface AuditEntry {
  id: number;
  admin_email: string;
  action: string;
  target_type: string;
  target_id: string | null;
  details: string | null;
  created_at: string;
}

const ACTION_CONFIG: Record<string, { icon: typeof Shield; color: string; bg: string; label: string }> = {
  grant_admin:      { icon: Shield,     color: "text-blue-600",   bg: "bg-blue-50",   label: "Granted Admin" },
  revoke_admin:     { icon: ShieldOff,  color: "text-orange-600", bg: "bg-orange-50", label: "Revoked Admin" },
  ban_user:         { icon: Ban,        color: "text-red-600",    bg: "bg-red-50",    label: "Banned User" },
  unban_user:       { icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50", label: "Unbanned User" },
  delete_user:      { icon: Trash2,     color: "text-red-700",    bg: "bg-red-50",    label: "Deleted User" },
  change_plan_to_pro:  { icon: Crown,   color: "text-amber-600",  bg: "bg-amber-50",  label: "Upgraded to Pro" },
  change_plan_to_free: { icon: ArrowUpDown, color: "text-gray-600", bg: "bg-gray-100", label: "Downgraded to Free" },
  disable_tool:     { icon: PowerOff,   color: "text-red-600",    bg: "bg-red-50",    label: "Disabled Tool" },
  enable_tool:      { icon: Power,      color: "text-green-600",  bg: "bg-green-50",  label: "Enabled Tool" },
  disable_platform: { icon: PowerOff,   color: "text-red-600",    bg: "bg-red-50",    label: "Disabled Downloader" },
  enable_platform:  { icon: Download,   color: "text-green-600",  bg: "bg-green-50",  label: "Enabled Downloader" },
};

const DEFAULT_CONFIG = { icon: Shield, color: "text-gray-600", bg: "bg-gray-100", label: "Action" };

export default function AuditLogClient() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  function loadPage(p: number) {
    setLoading(true);
    fetch(`/api/admin/audit-log?page=${p}`)
      .then(r => r.json())
      .then(d => {
        setEntries(d.rows || []);
        setTotal(d.total || 0);
        setTotalPages(d.totalPages || 1);
        setPage(d.page || 1);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadPage(1); }, []);

  if (loading && entries.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-border">
              <tr>
                {["Action", "Admin", "Target", "Details", "Time"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold text-muted uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-muted text-sm">No audit log entries yet.</td>
                </tr>
              ) : entries.map(entry => {
                const config = ACTION_CONFIG[entry.action] || DEFAULT_CONFIG;
                const Icon = config.icon;
                return (
                  <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-lg ${config.bg} flex items-center justify-center flex-shrink-0`}>
                          <Icon size={13} className={config.color} />
                        </div>
                        <span className="font-semibold text-foreground text-[13px]">{config.label}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-foreground">{entry.admin_email}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600 uppercase">{entry.target_type}</span>
                      {entry.target_id && (
                        <span className="ml-1.5 text-[11px] text-muted font-mono">{entry.target_id.slice(0, 8)}...</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[12px] text-muted max-w-[250px] truncate">{entry.details || "—"}</td>
                    <td className="px-4 py-3 text-[11px] text-muted whitespace-nowrap">
                      {new Date(entry.created_at).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted">
            {total} total entries
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadPage(page - 1)}
              disabled={page <= 1}
              className={`p-1.5 rounded-lg border border-border text-muted ${page <= 1 ? "opacity-40" : "hover:bg-gray-100 cursor-pointer"}`}
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-medium">{page} / {totalPages}</span>
            <button
              onClick={() => loadPage(page + 1)}
              disabled={page >= totalPages}
              className={`p-1.5 rounded-lg border border-border text-muted ${page >= totalPages ? "opacity-40" : "hover:bg-gray-100 cursor-pointer"}`}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
