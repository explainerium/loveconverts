"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MessageSquare,
  Users,
  BarChart3,
  ShieldCheck,
  ArrowLeft,
  Bell,
} from "lucide-react";
import { useState, useEffect } from "react";

const NAV = [
  { href: "/admin/inquiries", icon: MessageSquare, label: "Inquiries"  },
  { href: "/admin/users",     icon: Users,         label: "Users"      },
  { href: "/admin/stats",     icon: BarChart3,     label: "Statistics" },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    fetch("/api/admin/notifications")
      .then((r) => r.json())
      .then((d) => setUnread(d.unread_count ?? 0))
      .catch(() => {});
  }, []);

  return (
    <aside className="hidden lg:flex w-64 flex-shrink-0 flex-col bg-card border-r border-border h-full">
      {/* Header */}
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <ShieldCheck size={16} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-foreground text-sm">Admin Panel</p>
            <p className="text-[10px] text-muted uppercase tracking-wider">LoveConverts</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                active
                  ? "bg-primary-light text-primary"
                  : "text-muted hover:text-foreground hover:bg-gray-100"
              }`}
            >
              <Icon size={17} className="flex-shrink-0" />
              {label}
              {label === "Inquiries" && unread > 0 && (
                <span className="ml-auto flex items-center gap-1 text-[10px] font-bold bg-primary text-white px-1.5 py-0.5 rounded-full">
                  <Bell size={9} />
                  {unread}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted hover:text-foreground hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={17} />
          Back to Site
        </Link>
      </div>
    </aside>
  );
}
