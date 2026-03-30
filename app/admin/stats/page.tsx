import { auth } from "@/auth";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import { Users, ImageIcon, MessageSquare, CheckCircle2, TrendingUp, Download, AlertTriangle } from "lucide-react";
import AdminDownloaderToggle from "./AdminDownloaderToggle";

export const dynamic = "force-dynamic";

export default async function AdminStatsPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  if (!db) redirect("/dashboard");
  const d = db; // TS narrowing helper — db is guaranteed non-null after redirect()

  const totalUsers        = (d.prepare("SELECT COUNT(*) as cnt FROM users").get() as { cnt: number }).cnt;
  const totalConversions  = (d.prepare("SELECT COUNT(*) as cnt FROM conversions").get() as { cnt: number }).cnt;
  const openInquiries     = (d.prepare("SELECT COUNT(*) as cnt FROM inquiries WHERE status = 'open'").get() as { cnt: number }).cnt;
  const resolvedInquiries = (d.prepare("SELECT COUNT(*) as cnt FROM inquiries WHERE status = 'resolved'").get() as { cnt: number }).cnt;
  const newUsersThisWeek  = (d.prepare("SELECT COUNT(*) as cnt FROM users WHERE created_at >= unixepoch('now', '-7 days')").get() as { cnt: number }).cnt;

  const topTools = d
    .prepare("SELECT tool, COUNT(*) as cnt FROM conversions GROUP BY tool ORDER BY cnt DESC LIMIT 10")
    .all() as { tool: string; cnt: number }[];

  const topFormats = d
    .prepare("SELECT from_format, to_format, COUNT(*) as cnt FROM conversions GROUP BY from_format, to_format ORDER BY cnt DESC LIMIT 10")
    .all() as { from_format: string; to_format: string; cnt: number }[];

  const topSubjects = d
    .prepare("SELECT subject, COUNT(*) as cnt FROM inquiries GROUP BY subject ORDER BY cnt DESC LIMIT 10")
    .all() as { subject: string; cnt: number }[];

  const maxToolCnt    = topTools[0]?.cnt    || 1;
  const maxSubjectCnt = topSubjects[0]?.cnt || 1;

  // Downloader stats
  const PLATFORMS = [
    "tiktok", "instagram", "facebook", "twitter",
    "youtube", "youtube-shorts", "pinterest",
    "soundcloud", "vimeo", "dailymotion",
  ];

  const totalDownloads = (d.prepare("SELECT COUNT(*) as cnt FROM download_stats").get() as { cnt: number }).cnt;

  const downloaderStats = PLATFORMS.map(platform => {
    const total = (d.prepare("SELECT COUNT(*) as c FROM download_stats WHERE platform = ?").get(platform) as { c: number }).c;
    const successes = (d.prepare("SELECT COUNT(*) as c FROM download_stats WHERE platform = ? AND success = 1").get(platform) as { c: number }).c;
    const errors = total - successes;
    const blocked = d.prepare("SELECT disabled FROM platform_blocklist WHERE platform = ?").get(platform) as { disabled: number } | undefined;
    return {
      platform,
      total,
      successes,
      errors,
      successRate: total > 0 ? Math.round((successes / total) * 100) : null,
      errorRate: total > 0 ? Math.round((errors / total) * 100) : null,
      disabled: blocked?.disabled === 1,
      alert: total > 5 && errors / total > 0.5,
    };
  });

  const CARDS = [
    { label: "Total Users",          value: totalUsers,        icon: Users,         color: "text-blue-600",   bg: "bg-blue-50"   },
    { label: "Total Conversions",    value: totalConversions,  icon: ImageIcon,      color: "text-green-600",  bg: "bg-green-50"  },
    { label: "Open Inquiries",       value: openInquiries,     icon: MessageSquare,  color: "text-orange-600", bg: "bg-orange-50" },
    { label: "Resolved Inquiries",   value: resolvedInquiries, icon: CheckCircle2,   color: "text-primary",    bg: "bg-primary-light" },
    { label: "New Users (7 days)",   value: newUsersThisWeek,  icon: TrendingUp,     color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Total Downloads",      value: totalDownloads,    icon: Download,       color: "text-teal-600",   bg: "bg-teal-50"   },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">Site Statistics</h1>
        <p className="text-muted text-sm mt-0.5">Overview of LoveConverts activity</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {CARDS.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-card border border-border rounded-2xl p-4 shadow-sm">
            <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>
              <Icon size={18} className={color} />
            </div>
            <p className="text-2xl font-extrabold text-foreground">{value}</p>
            <p className="text-xs text-muted mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top tools */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <h2 className="font-bold text-foreground mb-4">Most Used Tools</h2>
          <div className="space-y-3">
            {topTools.length === 0 ? (
              <p className="text-sm text-muted">No data yet.</p>
            ) : topTools.map(({ tool, cnt }) => (
              <div key={tool} className="space-y-1">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-foreground capitalize">{tool.replace(/-/g, " ")}</span>
                  <span className="text-muted">{cnt}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-orange-500 rounded-full"
                    style={{ width: `${(cnt / maxToolCnt) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top inquiry subjects */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <h2 className="font-bold text-foreground mb-4">Top Inquiry Subjects</h2>
          <div className="space-y-3">
            {topSubjects.length === 0 ? (
              <p className="text-sm text-muted">No inquiries yet.</p>
            ) : topSubjects.map(({ subject, cnt }) => (
              <div key={subject} className="space-y-1">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-foreground">{subject}</span>
                  <span className="text-muted">{cnt}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"
                    style={{ width: `${(cnt / maxSubjectCnt) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Downloader Stats */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <Download size={16} className="text-primary" />
          <h2 className="font-bold text-foreground">Downloader Platform Stats</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-border">
              <tr>
                {["Platform", "Total", "Success", "Errors", "Success Rate", "Status"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold text-muted uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {downloaderStats.map(stat => (
                <tr key={stat.platform} className={`hover:bg-gray-50 transition-colors ${stat.alert ? "bg-red-50/40" : ""}`}>
                  <td className="px-4 py-3 font-semibold text-foreground capitalize flex items-center gap-1.5">
                    {stat.alert && <AlertTriangle size={13} className="text-red-500 flex-shrink-0" />}
                    {stat.platform.replace("-", " ")}
                  </td>
                  <td className="px-4 py-3 text-foreground">{stat.total}</td>
                  <td className="px-4 py-3 text-green-700 font-medium">{stat.successes}</td>
                  <td className="px-4 py-3 text-red-700 font-medium">{stat.errors}</td>
                  <td className="px-4 py-3">
                    {stat.successRate !== null ? (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${stat.successRate >= 80 ? "bg-green-100 text-green-800" : stat.successRate >= 50 ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"}`}>
                        {stat.successRate}%
                      </span>
                    ) : <span className="text-muted text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <AdminDownloaderToggle platform={stat.platform} disabled={stat.disabled} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top formats */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-bold text-foreground">Most Common Format Conversions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-border">
              <tr>
                {["From", "To", "Count"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold text-muted uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {topFormats.length === 0 ? (
                <tr><td colSpan={3} className="px-4 py-6 text-center text-muted text-sm">No data yet.</td></tr>
              ) : topFormats.map(({ from_format, to_format, cnt }, i) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-gray-100 text-gray-700">{from_format.toUpperCase()}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-primary text-white">{to_format.toUpperCase()}</span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-foreground">{cnt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
