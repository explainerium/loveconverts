"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, Loader2, Image as ImageIcon } from "lucide-react";

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

const PRIORITY_STYLES: Record<string, string> = {
  low:    "bg-gray-100 text-gray-600",
  medium: "bg-blue-50 text-blue-700",
  high:   "bg-orange-50 text-orange-700",
  urgent: "bg-red-100 text-red-700",
};

const STATUS_STYLES: Record<string, string> = {
  open:        "bg-yellow-50 text-yellow-700",
  in_progress: "bg-blue-50 text-blue-700",
  resolved:    "bg-green-50 text-green-700",
  closed:      "bg-gray-100 text-gray-500",
};

export default function InquiryDetail({ inquiry }: { inquiry: Inquiry }) {
  const [status,     setStatus]     = useState(inquiry.status);
  const [priority,   setPriority]   = useState(inquiry.priority);
  const [adminNotes, setAdminNotes] = useState(inquiry.admin_notes || "");
  const [saving,     setSaving]     = useState(false);
  const [saved,      setSaved]      = useState(false);
  const [imgOpen,    setImgOpen]    = useState(false);

  async function save(patch: Record<string, string>) {
    setSaving(true);
    setSaved(false);
    try {
      await fetch(`/api/admin/inquiries/${inquiry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main content */}
      <div className="lg:col-span-2 space-y-5">
        {/* Header card */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h2 className="text-xl font-extrabold text-foreground">{inquiry.subject}</h2>
              <p className="text-sm text-muted mt-0.5">
                {inquiry.name} · <a href={`mailto:${inquiry.email}`} className="text-primary hover:underline">{inquiry.email}</a>
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${PRIORITY_STYLES[priority] || ""}`}>
                {priority}
              </span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_STYLES[status] || ""}`}>
                {status.replace("_", " ")}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-muted mb-4">
            <div><p className="font-semibold text-foreground/60 uppercase tracking-wider mb-0.5">Reference</p><p className="font-mono font-bold text-primary">{inquiry.reference_number}</p></div>
            <div><p className="font-semibold text-foreground/60 uppercase tracking-wider mb-0.5">Tool</p><p>{inquiry.tool_related || "—"}</p></div>
            <div><p className="font-semibold text-foreground/60 uppercase tracking-wider mb-0.5">OS / Browser</p><p>{inquiry.os_browser || "—"}</p></div>
            <div><p className="font-semibold text-foreground/60 uppercase tracking-wider mb-0.5">Submitted</p><p>{new Date(inquiry.created_at).toLocaleString()}</p></div>
            <div><p className="font-semibold text-foreground/60 uppercase tracking-wider mb-0.5">Updated</p><p>{new Date(inquiry.updated_at).toLocaleString()}</p></div>
          </div>

          <div className="bg-background border border-border rounded-xl p-4">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Message</p>
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{inquiry.message}</p>
          </div>
        </div>

        {/* Screenshot */}
        {inquiry.screenshot_base64 && (
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Screenshot</p>
            <button onClick={() => setImgOpen(true)} className="group relative overflow-hidden rounded-xl border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={inquiry.screenshot_base64}
                alt="User screenshot"
                className="max-h-48 w-auto object-contain group-hover:opacity-90 transition-opacity"
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                <ImageIcon size={24} className="text-white" />
              </div>
            </button>
          </div>
        )}

        {/* Screenshot lightbox */}
        {imgOpen && inquiry.screenshot_base64 && (
          <div
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
            onClick={() => setImgOpen(false)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={inquiry.screenshot_base64}
              alt="Screenshot fullsize"
              className="max-w-full max-h-full rounded-xl shadow-2xl"
            />
          </div>
        )}
      </div>

      {/* Sidebar actions */}
      <div className="space-y-4">
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-foreground text-sm">Actions</h3>

          {/* Status */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted uppercase tracking-wider">Status</label>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); save({ status: e.target.value }); }}
              className="w-full px-3 py-2 text-sm border border-border rounded-xl bg-background focus:outline-none focus:border-primary"
            >
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          {/* Priority */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted uppercase tracking-wider">Priority</label>
            <select
              value={priority}
              onChange={(e) => { setPriority(e.target.value); save({ priority: e.target.value }); }}
              className="w-full px-3 py-2 text-sm border border-border rounded-xl bg-background focus:outline-none focus:border-primary"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          {/* Quick actions */}
          <div className="flex flex-col gap-2">
            <button
              onClick={() => { setStatus("resolved"); save({ status: "resolved" }); }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-50 text-green-700 text-sm font-semibold hover:bg-green-100 transition-colors"
            >
              <CheckCircle2 size={15} /> Mark Resolved
            </button>
            <button
              onClick={() => { setStatus("closed"); save({ status: "closed" }); }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 text-gray-600 text-sm font-semibold hover:bg-gray-200 transition-colors"
            >
              <XCircle size={15} /> Close Inquiry
            </button>
          </div>

          {/* Save indicator */}
          {(saving || saved) && (
            <p className={`text-xs flex items-center gap-1 ${saved ? "text-green-600" : "text-muted"}`}>
              {saving ? <><Loader2 size={11} className="animate-spin" /> Saving…</> : <><CheckCircle2 size={11} /> Saved</>}
            </p>
          )}
        </div>

        {/* Admin notes */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-3">
          <h3 className="font-bold text-foreground text-sm">Admin Notes (Private)</h3>
          <textarea
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            rows={5}
            placeholder="Internal notes — not visible to the customer…"
            className="w-full px-3 py-2 text-sm border border-border rounded-xl bg-background focus:outline-none focus:border-primary resize-y"
          />
          <button
            onClick={() => save({ admin_notes: adminNotes })}
            disabled={saving}
            className="w-full py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Notes"}
          </button>
        </div>
      </div>
    </div>
  );
}
