"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Trash2, Search, ImageIcon, Crop, Minimize2, Maximize2, Wand2, ChevronLeft, ChevronRight } from "lucide-react";

interface ConversionRow {
  id: string;
  filename: string;
  from_format: string;
  to_format: string;
  tool: string;
  original_size: number;
  converted_size: number;
  created_at: number;
}

function formatBytes(b: number) {
  if (b === 0) return "0 B";
  const k = 1024;
  const i = Math.floor(Math.log(b) / Math.log(k));
  return `${(b / Math.pow(k, i)).toFixed(1)} ${["B", "KB", "MB"][i]}`;
}

const TOOL_ICONS: Record<string, React.ElementType> = {
  converter:     ImageIcon,
  compress:      Minimize2,
  resize:        Maximize2,
  crop:          Crop,
  "photo-editor": Wand2,
};

const PER_PAGE = 10;

export default function HistoryPage() {
  const { data: session } = useSession();
  const [rows,          setRows]          = useState<ConversionRow[]>([]);
  const [filtered,      setFiltered]      = useState<ConversionRow[]>([]);
  const [search,        setSearch]        = useState("");
  const [page,          setPage]          = useState(1);
  const [showConfirm,   setShowConfirm]   = useState(false);
  const [loading,       setLoading]       = useState(true);

  const fetchHistory = useCallback(async () => {
    if (!session?.user?.id) return;
    setLoading(true);
    try {
      const res  = await fetch("/api/dashboard/history");
      const data = await res.json();
      setRows(data.rows ?? []);
      setFiltered(data.rows ?? []);
    } catch { /* ignore */ }
    setLoading(false);
  }, [session?.user?.id]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(rows.filter((r) =>
      r.filename.toLowerCase().includes(q) ||
      r.from_format.toLowerCase().includes(q) ||
      r.to_format.toLowerCase().includes(q) ||
      r.tool.toLowerCase().includes(q)
    ));
    setPage(1);
  }, [search, rows]);

  async function clearHistory() {
    await fetch("/api/dashboard/history", { method: "DELETE" });
    setRows([]);
    setFiltered([]);
    setShowConfirm(false);
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">Conversion History</h1>
          <p className="text-muted text-sm mt-0.5">{rows.length} total conversion{rows.length !== 1 ? "s" : ""}</p>
        </div>
        {rows.length > 0 && (
          <button
            onClick={() => setShowConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 transition-colors"
          >
            <Trash2 size={14} />
            Clear All
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by filename, format, or tool…"
          className="w-full pl-10 pr-4 py-2.5 text-sm border border-border rounded-xl focus:outline-none focus:border-primary bg-card"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-card border border-border rounded-2xl divide-y divide-border">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-5 py-4 animate-pulse flex gap-4">
              <div className="w-8 h-8 rounded-xl bg-gray-100 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-100 rounded w-1/3" />
                <div className="h-2.5 bg-gray-100 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : paginated.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center text-muted">
          {search ? "No results match your search." : "No conversion history yet."}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          {/* Header */}
          <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-4 px-5 py-3 bg-gray-50 border-b border-border text-xs font-semibold text-muted uppercase tracking-wide">
            <span>File Name</span><span>Format</span><span>Tool</span><span>Size</span><span>Date</span>
          </div>
          {paginated.map((row, i) => {
            const Icon = TOOL_ICONS[row.tool] ?? ImageIcon;
            const savings = row.original_size > 0 && row.converted_size < row.original_size
              ? Math.round((1 - row.converted_size / row.original_size) * 100)
              : 0;
            return (
              <div key={row.id} className={`flex md:grid md:grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-4 px-5 py-3.5 items-center text-sm ${i < paginated.length - 1 ? "border-b border-border" : ""}`}>
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-primary-light flex items-center justify-center flex-shrink-0">
                    <Icon size={13} className="text-primary" />
                  </div>
                  <span className="truncate font-medium text-foreground" title={row.filename}>{row.filename}</span>
                </div>
                <span className="hidden md:block text-muted">
                  <span className="font-medium text-foreground">{row.from_format.toUpperCase()}</span>
                  <span className="mx-1 text-gray-300">→</span>
                  <span className="font-medium text-foreground">{row.to_format.toUpperCase()}</span>
                </span>
                <span className="hidden md:block text-muted capitalize">{row.tool.replace(/-/g, " ")}</span>
                <span className="hidden md:block text-muted">
                  {formatBytes(row.original_size)}
                  {savings > 0 && <span className="ml-1 text-green-600 font-semibold text-xs">−{savings}%</span>}
                </span>
                <span className="hidden md:block text-muted text-xs">
                  {new Date(row.created_at * 1000).toLocaleDateString()}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">
            Page {page} of {totalPages} ({filtered.length} results)
          </span>
          <div className="flex gap-1">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="p-2 rounded-lg border border-border hover:bg-gray-50 disabled:opacity-40 transition-colors">
              <ChevronLeft size={14} />
            </button>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="p-2 rounded-lg border border-border hover:bg-gray-50 disabled:opacity-40 transition-colors">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Confirm dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card rounded-2xl border border-border p-6 max-w-sm w-full shadow-2xl space-y-4 animate-fade-in-up">
            <h3 className="font-bold text-foreground">Clear all history?</h3>
            <p className="text-muted text-sm">This will permanently delete all your conversion history. This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={clearHistory}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition-colors">
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
