"use client";

import { useState, FormEvent } from "react";
import { useSession } from "next-auth/react";
import { User, Bell, Trash2, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button role="switch" aria-checked={checked} type="button"
      onClick={() => onChange(!checked)} className="toggle-track flex-shrink-0">
      <span className="toggle-thumb" />
    </button>
  );
}

export default function SettingsPage() {
  const { data: session, update } = useSession();

  const [name,      setName]      = useState(session?.user?.name ?? "");
  const [email,     setEmail]     = useState(session?.user?.email ?? "");
  const [saving,    setSaving]    = useState(false);
  const [msg,       setMsg]       = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showDelete,setShowDelete]= useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const [notifs, setNotifs] = useState({
    conversionDone:   true,
    weeklyDigest:     false,
    productUpdates:   true,
  });

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/dashboard/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      await update({ name });
      setMsg({ type: "success", text: "Profile updated successfully." });
    } catch (err) {
      setMsg({ type: "error", text: err instanceof Error ? err.message : "Update failed" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">Account Settings</h1>
        <p className="text-muted text-sm mt-1">Manage your profile and preferences.</p>
      </div>

      {/* Profile */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <User size={17} className="text-primary" />
          <h2 className="font-bold text-foreground">Profile</h2>
        </div>

        {msg && (
          <div className={`flex items-center gap-2 text-sm px-4 py-3 rounded-xl ${
            msg.type === "success" ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"
          }`}>
            {msg.type === "success" ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
            {msg.text}
          </div>
        )}

        <form onSubmit={saveProfile} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Full Name</label>
            <input
              type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Your name" autoComplete="name"
              className="w-full px-3.5 py-2.5 text-sm border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 bg-background"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Email</label>
            <input type="email" value={email} disabled
              className="w-full px-3.5 py-2.5 text-sm border border-border rounded-xl bg-gray-50 text-muted cursor-not-allowed"
            />
            <p className="text-xs text-muted">Email cannot be changed.</p>
          </div>
          <button type="submit" disabled={saving}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all ${saving ? "bg-gray-300 cursor-not-allowed" : "bg-primary hover:bg-primary-hover active:scale-95"}`}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : "Save Changes"}
          </button>
        </form>
      </div>

      {/* Notifications */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-2">
          <Bell size={17} className="text-primary" />
          <h2 className="font-bold text-foreground">Notification Preferences</h2>
        </div>
        <div className="space-y-4">
          {([
            { key: "conversionDone",  label: "Conversion completed",   desc: "Notify when a batch conversion finishes." },
            { key: "weeklyDigest",    label: "Weekly digest",           desc: "A summary of your weekly activity."       },
            { key: "productUpdates",  label: "Product updates",         desc: "New features and improvements."           },
          ] as const).map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-foreground">{label}</p>
                <p className="text-xs text-muted">{desc}</p>
              </div>
              <Toggle checked={notifs[key]} onChange={(v) => setNotifs((n) => ({ ...n, [key]: v }))} />
            </div>
          ))}
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-card border border-red-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Trash2 size={17} className="text-red-500" />
          <h2 className="font-bold text-red-600">Danger Zone</h2>
        </div>
        <p className="text-sm text-muted">Permanently delete your account and all associated data. This cannot be undone.</p>
        <button onClick={() => setShowDelete(true)}
          className="px-5 py-2.5 rounded-xl text-sm font-bold text-red-600 border border-red-200 hover:bg-red-50 transition-colors">
          Delete Account
        </button>
      </div>

      {/* Delete confirm modal */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card rounded-2xl border border-border p-6 max-w-sm w-full shadow-2xl space-y-4 animate-fade-in-up">
            <h3 className="font-bold text-foreground">Delete your account?</h3>
            <p className="text-muted text-sm">This will permanently delete your account and all conversion history. Type <strong>DELETE</strong> to confirm.</p>
            <input type="text" value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="Type DELETE to confirm" className="w-full px-3.5 py-2.5 text-sm border border-border rounded-xl focus:outline-none focus:border-red-400" />
            <div className="flex gap-3">
              <button onClick={() => { setShowDelete(false); setDeleteConfirm(""); }}
                className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button disabled={deleteConfirm !== "DELETE"}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition-colors disabled:opacity-40">
                Delete Forever
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
