"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  History,
  Settings,
  Lock,
  Zap,
  ArrowLeft,
  Menu,
  X,
  LogOut,
  User,
  Headphones,
} from "lucide-react";

const NAV = [
  { href: "/dashboard",                 icon: LayoutDashboard, label: "Overview"          },
  { href: "/dashboard/history",         icon: History,         label: "Conversion History" },
  { href: "/dashboard/settings",        icon: Settings,        label: "Account Settings"   },
  { href: "/dashboard/change-password", icon: Lock,            label: "Change Password"    },
  { href: "/support",                   icon: Headphones,      label: "Submit Inquiry"     },
];

interface Props {
  userName?: string | null;
  userEmail?: string | null;
  plan: "free" | "pro";
}

function SidebarContent({ userName, userEmail, plan, onClose }: Props & { onClose?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full">
      {/* User info */}
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center flex-shrink-0">
            <User size={18} className="text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-foreground text-sm truncate">{userName || "User"}</p>
            <p className="text-xs text-muted truncate">{userEmail}</p>
          </div>
          {plan === "pro" && (
            <span className="ml-auto flex-shrink-0 text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">PRO</span>
          )}
          {onClose && (
            <button onClick={onClose} className="ml-auto p-1 text-muted hover:text-foreground lg:hidden">
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                active
                  ? "bg-primary-light text-primary"
                  : "text-muted hover:text-foreground hover:bg-gray-100"
              }`}
            >
              <Icon size={17} className="flex-shrink-0" />
              {label}
            </Link>
          );
        })}

        {/* Upgrade */}
        <div className="pt-2">
          {plan === "free" ? (
            <Link
              href="/dashboard/upgrade"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-primary to-orange-500 hover:from-primary-hover hover:to-orange-600 transition-all shadow-sm"
            >
              <Zap size={17} className="flex-shrink-0" />
              Upgrade to Pro
            </Link>
          ) : (
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-amber-700 bg-amber-50 border border-amber-200">
              <Zap size={17} className="flex-shrink-0" />
              Pro Plan Active ✓
            </div>
          )}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border space-y-0.5">
        <Link
          href="/"
          onClick={onClose}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted hover:text-foreground hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={17} />
          Back to Tools
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted hover:text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut size={17} />
          Sign Out
        </button>
      </div>
    </div>
  );
}

export default function DashboardSidebar(props: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed top-20 left-4 z-40 p-2.5 bg-card border border-border rounded-xl shadow-md text-muted hover:text-foreground transition-colors"
      >
        <Menu size={18} />
      </button>

      {/* Mobile overlay */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div className={`lg:hidden fixed top-0 left-0 z-50 h-full w-72 bg-card border-r border-border shadow-xl transform transition-transform duration-300 ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}>
        <SidebarContent {...props} onClose={() => setOpen(false)} />
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 flex-shrink-0 flex-col bg-card border-r border-border h-full">
        <SidebarContent {...props} />
      </aside>
    </>
  );
}
