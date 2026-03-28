"use client";

import { useState, useRef, FormEvent } from "react";
import {
  Headphones,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Paperclip,
  X,
} from "lucide-react";

const SUBJECTS = [
  "Conversion not working",
  "Image quality issue",
  "Tool bug / error",
  "Feature request",
  "Account / billing",
  "Performance issue",
  "Other",
];

const PRIORITIES = [
  { value: "low",    label: "Low — Not urgent"         },
  { value: "medium", label: "Medium — Affects workflow" },
  { value: "high",   label: "High — Blocking me"       },
  { value: "urgent", label: "Urgent — Critical issue"  },
];

const TOOLS = [
  "Convert Image",
  "Compress Image",
  "Resize Image",
  "Crop Image",
  "Convert to JPG",
  "Photo Editor",
  "Not tool-related",
];

export default function SupportPage() {
  const [name,       setName]       = useState("");
  const [email,      setEmail]      = useState("");
  const [subject,    setSubject]    = useState("");
  const [priority,   setPriority]   = useState("medium");
  const [tool,       setTool]       = useState("");
  const [osBrowser,  setOsBrowser]  = useState("");
  const [message,    setMessage]    = useState("");
  const [file,       setFile]       = useState<File | null>(null);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");
  const [success,    setSuccess]    = useState<{ ref: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { setError("Screenshot must be under 5 MB."); return; }
    setFile(f);
    setError("");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let screenshotBase64: string | undefined;
      if (file) {
        const buf = await file.arrayBuffer();
        const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
        screenshotBase64 = `data:${file.type};base64,${b64}`;
      }

      const res = await fetch("/api/support/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, email, subject, priority,
          tool_related: tool,
          os_browser: osBrowser,
          message,
          screenshot_base64: screenshotBase64,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");

      setSuccess({ ref: data.reference_number });
      setName(""); setEmail(""); setSubject(""); setPriority("medium");
      setTool(""); setOsBrowser(""); setMessage(""); setFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full text-center space-y-5">
          <div className="w-20 h-20 rounded-full bg-green-50 border-4 border-green-200 flex items-center justify-center mx-auto">
            <CheckCircle2 size={36} className="text-green-500" />
          </div>
          <h2 className="text-2xl font-extrabold text-foreground">Inquiry Received!</h2>
          <p className="text-muted">
            We&apos;ll get back to you within <strong>24 hours</strong>. Track your inquiry with:
          </p>
          <div className="bg-primary-light border border-primary/20 rounded-2xl px-6 py-4">
            <p className="text-xs text-muted uppercase tracking-wider font-semibold mb-1">Reference Number</p>
            <p className="text-2xl font-black text-primary tracking-widest">{success.ref}</p>
          </div>
          <button
            onClick={() => setSuccess(null)}
            className="px-6 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary-hover transition-colors"
          >
            Submit Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background">
      {/* Hero */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pt-14 pb-10 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center mx-auto shadow-lg">
          <Headphones size={28} className="text-white" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-foreground">
          How can we help you?
        </h1>
        <p className="text-muted text-lg max-w-xl mx-auto">
          Submit your issue or question below. We review every message and aim
          to reply within 24 hours.
        </p>
      </section>

      {/* Form */}
      <section className="max-w-2xl mx-auto px-4 sm:px-6 pb-20">
        <div className="bg-card border border-border rounded-2xl shadow-sm p-6 sm:p-8">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-5">
              <AlertCircle size={15} className="flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name + Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground">
                  Full Name <span className="text-primary">*</span>
                </label>
                <input
                  type="text" value={name} onChange={(e) => setName(e.target.value)}
                  required placeholder="Jane Smith"
                  className="w-full px-3.5 py-2.5 text-sm border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 bg-background"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground">
                  Email Address <span className="text-primary">*</span>
                </label>
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  required placeholder="you@example.com"
                  className="w-full px-3.5 py-2.5 text-sm border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 bg-background"
                />
              </div>
            </div>

            {/* Subject */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">
                Subject <span className="text-primary">*</span>
              </label>
              <select
                value={subject} onChange={(e) => setSubject(e.target.value)} required
                className="w-full px-3.5 py-2.5 text-sm border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 bg-background"
              >
                <option value="">Select a subject…</option>
                {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Priority + Tool */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground">Priority</label>
                <select
                  value={priority} onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 bg-background"
                >
                  {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground">Tool Related To</label>
                <select
                  value={tool} onChange={(e) => setTool(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 bg-background"
                >
                  <option value="">None / General</option>
                  {TOOLS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            {/* OS/Browser */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">
                OS &amp; Browser{" "}
                <span className="text-muted font-normal">(helps us reproduce issues)</span>
              </label>
              <input
                type="text" value={osBrowser} onChange={(e) => setOsBrowser(e.target.value)}
                placeholder="e.g. macOS 14 / Chrome 124"
                className="w-full px-3.5 py-2.5 text-sm border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 bg-background"
              />
            </div>

            {/* Message */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">
                Message <span className="text-primary">*</span>
              </label>
              <textarea
                value={message} onChange={(e) => setMessage(e.target.value)}
                required rows={5} placeholder="Describe your issue in detail…"
                className="w-full px-3.5 py-2.5 text-sm border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 bg-background resize-y"
              />
            </div>

            {/* Screenshot */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">
                Screenshot{" "}
                <span className="text-muted font-normal">(optional, max 5 MB)</span>
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-medium text-muted hover:text-foreground hover:border-primary transition-colors"
                >
                  <Paperclip size={14} />
                  {file ? file.name : "Attach screenshot"}
                </button>
                {file && (
                  <button
                    type="button"
                    onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = ""; }}
                    className="text-muted hover:text-red-500 transition-colors"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <input
                ref={fileRef} type="file" accept="image/*"
                onChange={handleFile} className="hidden"
              />
            </div>

            <button
              type="submit" disabled={loading}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white text-sm transition-all ${
                loading ? "bg-gray-300 cursor-not-allowed" : "bg-gradient-to-r from-primary to-orange-500 hover:from-primary-hover hover:to-orange-600 shadow-md active:scale-[0.98]"
              }`}
            >
              {loading ? (
                <><Loader2 size={16} className="animate-spin" /> Submitting…</>
              ) : (
                <><Send size={16} /> Submit Inquiry</>
              )}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
