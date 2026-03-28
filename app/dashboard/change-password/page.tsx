"use client";

import { useState, FormEvent } from "react";
import { Lock, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

function PasswordStrength({ password }: { password: string }) {
  const score = [password.length >= 8, /[A-Z]/.test(password), /[a-z]/.test(password), /\d/.test(password)].filter(Boolean).length;
  const colors = ["bg-gray-200", "bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-green-500"];
  return (
    <div className="flex gap-1 mt-1.5">
      {[0,1,2,3].map((i) => (
        <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < score ? colors[score] : "bg-gray-200"}`} />
      ))}
    </div>
  );
}

export default function ChangePasswordPage() {
  const [current,   setCurrent]   = useState("");
  const [next,      setNext]      = useState("");
  const [confirm,   setConfirm]   = useState("");
  const [showCur,   setShowCur]   = useState(false);
  const [showNew,   setShowNew]   = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [msg,       setMsg]       = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (next !== confirm) { setMsg({ type: "error", text: "New passwords do not match." }); return; }
    if (next.length < 8)  { setMsg({ type: "error", text: "Password must be at least 8 characters." }); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMsg({ type: "success", text: "Password changed successfully." });
      setCurrent(""); setNext(""); setConfirm("");
    } catch (err) {
      setMsg({ type: "error", text: err instanceof Error ? err.message : "Failed to change password." });
    } finally {
      setLoading(false);
    }
  }

  const pwField = (label: string, value: string, onChange: (v: string) => void, show: boolean, setShow: (v: boolean) => void, autoComplete: string) => (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"} value={value} onChange={(e) => onChange(e.target.value)}
          required autoComplete={autoComplete}
          className="w-full px-3.5 py-2.5 pr-10 text-sm border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 bg-background"
        />
        <button type="button" onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors">
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-md">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">Change Password</h1>
        <p className="text-muted text-sm mt-1">Update your account password.</p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-2">
          <Lock size={17} className="text-primary" />
          <h2 className="font-bold text-foreground">Update Password</h2>
        </div>

        {msg && (
          <div className={`flex items-center gap-2 text-sm px-4 py-3 rounded-xl ${
            msg.type === "success" ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"
          }`}>
            {msg.type === "success" ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
            {msg.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {pwField("Current Password",     current, setCurrent, showCur, setShowCur, "current-password")}
          <div>
            {pwField("New Password",         next,    setNext,    showNew, setShowNew,  "new-password")}
            {next && <PasswordStrength password={next} />}
          </div>
          {pwField("Confirm New Password",  confirm, setConfirm, showNew, setShowNew,  "new-password")}
          {next && confirm && next !== confirm && (
            <p className="text-xs text-red-500">Passwords do not match.</p>
          )}
          <button type="submit" disabled={loading}
            className={`w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all ${loading ? "bg-gray-300 cursor-not-allowed" : "bg-primary hover:bg-primary-hover active:scale-95 shadow-md"}`}>
            {loading ? <Loader2 size={14} className="animate-spin mx-auto" /> : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
