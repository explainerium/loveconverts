"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Clock, ArrowRight, Trash2 } from "lucide-react";
import { getRecentFiles, clearRecentFiles, formatTimeAgo, type RecentFile } from "@/lib/recent-history";

function fmtBytes(n: number) {
  if (n < 1024) return n + " B";
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + " KB";
  return (n / (1024 * 1024)).toFixed(2) + " MB";
}

export default function RecentConversions() {
  const [items, setItems] = useState<RecentFile[]>([]);

  useEffect(() => {
    setItems(getRecentFiles());
  }, []);

  if (items.length === 0) return null;

  const handleClear = () => {
    if (confirm("Clear all recent conversion history?")) {
      clearRecentFiles();
      setItems([]);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 pb-8">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-sm font-bold text-muted uppercase tracking-wider">Recent Conversions</h2>
          <p className="text-[11px] text-muted/60 mt-0.5">Stored locally in your browser. Never sent to our servers.</p>
        </div>
        <button
          onClick={handleClear}
          className="flex items-center gap-1 text-[11px] text-muted hover:text-red-500 transition-colors"
        >
          <Trash2 size={11} />
          Clear history
        </button>
      </div>

      <div className="space-y-1.5">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate" title={item.fileName}>
                {item.fileName.length > 30 ? item.fileName.slice(0, 30) + "..." : item.fileName}
              </p>
              <div className="flex items-center gap-2 text-xs text-muted mt-0.5">
                <span>{item.action}</span>
                <span className="text-muted/40">|</span>
                <span>{fmtBytes(item.originalSize)} &rarr; {fmtBytes(item.outputSize)}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="flex items-center gap-1 text-[11px] text-muted">
                <Clock size={10} />
                {formatTimeAgo(item.timestamp)}
              </span>
              <Link
                href={item.toolUrl}
                className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
              >
                Convert again <ArrowRight size={10} />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
