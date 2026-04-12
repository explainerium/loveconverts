"use client";

import { useState, useEffect } from "react";
import {
  Minimize2, Maximize2, Crop, Wand2, Sparkles, ImageIcon, Video, FileImage,
  Power, PowerOff, Loader2,
} from "lucide-react";

interface ToolItem {
  id: string;
  label: string;
  disabled: boolean;
  reason: string | null;
  updated_at: string | null;
}

const ICON_MAP: Record<string, typeof ImageIcon> = {
  converter: ImageIcon,
  compress: Minimize2,
  resize: Maximize2,
  crop: Crop,
  "convert-to-jpg": FileImage,
  "photo-editor": Wand2,
  enhance: Sparkles,
  "compress-video": Video,
};

export default function ToolsManageClient() {
  const [tools, setTools] = useState<ToolItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/tools")
      .then(r => r.json())
      .then(d => setTools(d.tools || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function toggle(tool: ToolItem) {
    const newDisabled = !tool.disabled;
    let reason: string | undefined;
    if (newDisabled) {
      const r = prompt(`Disable "${tool.label}"?\n\nEnter reason (optional):`);
      if (r === null) return;
      reason = r || undefined;
    } else {
      if (!confirm(`Re-enable "${tool.label}"?`)) return;
    }

    setToggling(tool.id);
    try {
      const res = await fetch("/api/admin/tools", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool: tool.id, disabled: newDisabled, reason }),
      });
      if (res.ok) {
        setTools(prev => prev.map(t =>
          t.id === tool.id ? { ...t, disabled: newDisabled, reason: reason || null, updated_at: new Date().toISOString() } : t
        ));
      }
    } finally {
      setToggling(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-muted" />
      </div>
    );
  }

  const enabled = tools.filter(t => !t.disabled);
  const disabled = tools.filter(t => t.disabled);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
          <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center mb-3">
            <Power size={18} className="text-green-600" />
          </div>
          <p className="text-2xl font-extrabold text-foreground">{enabled.length}</p>
          <p className="text-xs text-muted mt-0.5">Active Tools</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
          <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center mb-3">
            <PowerOff size={18} className="text-red-600" />
          </div>
          <p className="text-2xl font-extrabold text-foreground">{disabled.length}</p>
          <p className="text-xs text-muted mt-0.5">Disabled Tools</p>
        </div>
      </div>

      {/* Tool list */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-border">
              <tr>
                {["Tool", "Status", "Reason", "Last Updated", "Action"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold text-muted uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tools.map(tool => {
                const Icon = ICON_MAP[tool.id] || ImageIcon;
                return (
                  <tr key={tool.id} className={`hover:bg-gray-50 transition-colors ${tool.disabled ? "bg-red-50/30" : ""}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tool.disabled ? "bg-gray-100" : "bg-primary/10"}`}>
                          <Icon size={15} className={tool.disabled ? "text-gray-400" : "text-primary"} />
                        </div>
                        <span className="font-semibold text-foreground">{tool.label}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {tool.disabled ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-700">
                          <PowerOff size={10} /> Disabled
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-green-100 text-green-700">
                          <Power size={10} /> Active
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[12px] text-muted max-w-[200px] truncate">
                      {tool.reason || "—"}
                    </td>
                    <td className="px-4 py-3 text-[12px] text-muted whitespace-nowrap">
                      {tool.updated_at ? new Date(tool.updated_at).toLocaleString() : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggle(tool)}
                        disabled={toggling === tool.id}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-40 ${
                          tool.disabled
                            ? "bg-green-50 text-green-700 hover:bg-green-100"
                            : "bg-red-50 text-red-600 hover:bg-red-100"
                        }`}
                      >
                        {toggling === tool.id ? (
                          <Loader2 size={11} className="animate-spin" />
                        ) : tool.disabled ? (
                          <Power size={11} />
                        ) : (
                          <PowerOff size={11} />
                        )}
                        {tool.disabled ? "Enable" : "Disable"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
