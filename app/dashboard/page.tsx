import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import db from "@/lib/db";
import { FREE_DAILY_LIMIT } from "@/lib/limits";
import {
  TrendingUp,
  Calendar,
  Zap,
  BarChart3,
  ImageIcon,
  Crop,
  Minimize2,
  Maximize2,
  Wand2,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

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

function timeAgo(ts: number) {
  const diff = (Date.now() / 1000 - ts);
  if (diff < 60)    return "just now";
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(ts * 1000).toLocaleDateString();
}

const TOOL_ICONS: Record<string, React.ElementType> = {
  converter:    ImageIcon,
  compress:     Minimize2,
  resize:       Maximize2,
  crop:         Crop,
  "photo-editor": Wand2,
};

const TOOLS_QUICK = [
  { href: "/",                     icon: ImageIcon, label: "Convert Image" },
  { href: "/tools/compress",       icon: Minimize2, label: "Compress"      },
  { href: "/tools/resize",         icon: Maximize2, label: "Resize"        },
  { href: "/tools/crop",           icon: Crop,      label: "Crop"          },
  { href: "/tools/photo-editor",   icon: Wand2,     label: "Photo Editor"  },
];

const FREE_FEATURES = [
  "20 conversions per day",
  "Up to 10 MB per file",
  "All 7 output formats",
  "Basic compression & resize",
];
const PRO_FEATURES = [
  "Unlimited conversions",
  "Up to 50 MB per file",
  "Priority processing",
  "Batch up to 50 files",
  "All advanced options",
  "No watermarks",
];

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const uid   = session.user.id;
  const plan  = session.user.plan ?? "free";
  const today = new Date().toISOString().slice(0, 10);

  let totalConversions = 0;
  let todayConversions = 0;
  let favTool = "—";
  let recent: ConversionRow[] = [];
  let dailyUsed = 0;

  if (db) {
    totalConversions = (db
      .prepare("SELECT COUNT(*) as cnt FROM conversions WHERE user_id = ?")
      .get(uid) as { cnt: number }).cnt;

    todayConversions = (db
      .prepare("SELECT COUNT(*) as cnt FROM conversions WHERE user_id = ? AND date(created_at,'unixepoch') = ?")
      .get(uid, today) as { cnt: number }).cnt;

    favTool = (db
      .prepare("SELECT tool, COUNT(*) as cnt FROM conversions WHERE user_id = ? GROUP BY tool ORDER BY cnt DESC LIMIT 1")
      .get(uid) as { tool: string; cnt: number } | undefined)?.tool ?? "—";

    recent = db
      .prepare("SELECT * FROM conversions WHERE user_id = ? ORDER BY created_at DESC LIMIT 5")
      .all(uid) as ConversionRow[];

    dailyUsed = plan === "free"
      ? ((db.prepare("SELECT count FROM daily_usage WHERE user_id = ? AND date = ?").get(uid, today) as { count: number } | undefined)?.count ?? 0)
      : 0;
  }

  const dailyRemaining = plan === "free" ? Math.max(0, FREE_DAILY_LIMIT - dailyUsed) : null;

  const stats = [
    { label: "Total Conversions",   value: totalConversions, icon: TrendingUp,  color: "text-blue-600",  bg: "bg-blue-50"  },
    { label: "Conversions Today",   value: todayConversions, icon: Calendar,    color: "text-green-600", bg: "bg-green-50" },
    { label: "Daily Remaining",     value: dailyRemaining !== null ? dailyRemaining : "∞", icon: BarChart3, color: "text-orange-600", bg: "bg-orange-50" },
    { label: "Favorite Tool",       value: favTool.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()), icon: Zap, color: "text-primary", bg: "bg-primary-light" },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">
          Welcome back{session.user.name ? `, ${session.user.name.split(" ")[0]}` : ""}! 👋
        </h1>
        <p className="text-muted mt-1">Here&apos;s a summary of your LoveConverts activity.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-card border border-border rounded-2xl p-4 shadow-sm">
            <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>
              <Icon size={18} className={color} />
            </div>
            <p className="text-2xl font-extrabold text-foreground">{value}</p>
            <p className="text-xs text-muted mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Usage bar (free plan) */}
      {plan === "free" && (
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-foreground text-sm">Daily Usage</p>
            <span className="text-xs text-muted">{dailyUsed} of {FREE_DAILY_LIMIT} free conversions used today</span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${Math.min(100, (dailyUsed / FREE_DAILY_LIMIT) * 100)}%` }}
            />
          </div>
          {dailyUsed >= FREE_DAILY_LIMIT && (
            <p className="text-xs text-red-600">Daily limit reached. Upgrade to Pro for unlimited conversions.</p>
          )}
        </div>
      )}

      {/* Quick actions */}
      <div className="space-y-3">
        <h2 className="font-bold text-foreground">Quick Actions</h2>
        <div className="flex flex-wrap gap-2">
          {TOOLS_QUICK.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card border border-border text-sm font-medium text-foreground hover:border-primary hover:text-primary hover:bg-primary-light/30 transition-colors shadow-sm"
            >
              <Icon size={15} className="text-primary" />
              {label}
              <ArrowRight size={13} className="text-muted ml-0.5" />
            </Link>
          ))}
        </div>
      </div>

      {/* Recent activity */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-foreground">Recent Activity</h2>
          <Link href="/dashboard/history" className="text-xs text-primary hover:underline font-medium">View all</Link>
        </div>
        {recent.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-8 text-center text-muted text-sm">
            No conversions yet. <Link href="/" className="text-primary hover:underline">Start converting!</Link>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            {recent.map((row, i) => {
              const Icon = TOOL_ICONS[row.tool] ?? ImageIcon;
              return (
                <div key={row.id} className={`flex items-center gap-4 px-5 py-3.5 ${i < recent.length - 1 ? "border-b border-border" : ""}`}>
                  <div className="w-8 h-8 rounded-xl bg-primary-light flex items-center justify-center flex-shrink-0">
                    <Icon size={15} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{row.filename}</p>
                    <p className="text-xs text-muted">
                      {row.from_format.toUpperCase()} → {row.to_format.toUpperCase()} · {formatBytes(row.original_size)} → {formatBytes(row.converted_size)}
                    </p>
                  </div>
                  <span className="text-xs text-muted flex-shrink-0">{timeAgo(row.created_at)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Plan card */}
      {plan === "free" ? (
        <div className="bg-gradient-to-br from-primary to-orange-500 rounded-2xl p-6 text-white shadow-lg">
          <h2 className="font-extrabold text-lg mb-1">Upgrade to Pro</h2>
          <p className="text-white/80 text-sm mb-4">Unlock unlimited conversions and advanced features.</p>
          <div className="grid grid-cols-2 gap-1 mb-5">
            {PRO_FEATURES.map((f) => (
              <div key={f} className="flex items-center gap-1.5 text-[12px] text-white/90">
                <CheckCircle2 size={13} className="text-white flex-shrink-0" />
                {f}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <button className="px-5 py-2.5 bg-white text-primary font-bold text-sm rounded-xl hover:bg-white/90 transition-colors shadow-md">
              $4.99/month — Upgrade Now
            </button>
            <span className="text-white/70 text-xs">or $39.99/year (save 33%)</span>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
            <Zap size={20} className="text-amber-600" />
          </div>
          <div>
            <p className="font-bold text-foreground">You&apos;re on Pro ✓</p>
            <p className="text-muted text-sm">Enjoy unlimited conversions and all premium features.</p>
          </div>
          <span className="ml-auto text-xs font-bold bg-amber-200 text-amber-800 px-2.5 py-1 rounded-full">PRO</span>
        </div>
      )}

      {/* Free features (only for free users) */}
      {plan === "free" && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-3 shadow-sm">
          <h3 className="font-semibold text-foreground text-sm">Your Free Plan Includes:</h3>
          <div className="grid grid-cols-2 gap-1">
            {FREE_FEATURES.map((f) => (
              <div key={f} className="flex items-center gap-1.5 text-xs text-muted">
                <CheckCircle2 size={12} className="text-green-500 flex-shrink-0" />
                {f}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
