"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Menu, X, User, LogOut, LayoutDashboard, ChevronDown,
  Headphones, ShieldCheck, Settings, History, Image, Minimize2,
  Maximize2, Crop, Download, Music, Film, AlertTriangle, Wand2,
  Zap, Crown, Sparkles,
} from "lucide-react";
import Logo from "./Logo";

const IMAGE_TOOLS = [
  { href: "/tools/compress",       label: "Compress Image",    icon: Minimize2,  desc: "Reduce file size without losing quality" },
  { href: "/tools/resize",         label: "Resize Image",      icon: Maximize2,  desc: "Change dimensions & social presets" },
  { href: "/tools/crop",           label: "Crop Image",        icon: Crop,       desc: "Trim to any aspect ratio" },
  { href: "/tools/convert-to-jpg", label: "Convert to JPG",    icon: Image,      desc: "Any format into universal JPG" },
  { href: "/tools/photo-editor",   label: "Photo Editor",      icon: Wand2,      desc: "Adjust brightness, filters & more" },
  { href: "/tools/enhance",        label: "AI Enhance",        icon: Sparkles,   desc: "Upscale, denoise, sharpen & HDR" },
];

const DOWNLOADERS_LEFT = [
  { href: "/downloaders/tiktok",    label: "TikTok",           warn: false },
  { href: "/downloaders/instagram", label: "Instagram",        warn: false },
  { href: "/downloaders/facebook",  label: "Facebook",         warn: false },
  { href: "/downloaders/twitter",   label: "Twitter / X",      warn: false },
  { href: "/downloaders/youtube",   label: "YouTube",          warn: true  },
  { href: "/downloaders/youtube-shorts", label: "YouTube Shorts", warn: true },
  { href: "/downloaders/pinterest", label: "Pinterest",        warn: false },
];

const DOWNLOADERS_RIGHT = [
  { href: "/downloaders/soundcloud", label: "SoundCloud", icon: Music },
  { href: "/downloaders/vimeo",      label: "Vimeo",      icon: Film },
  { href: "/downloaders/dailymotion",label: "Dailymotion", icon: Film },
];

function DropdownMenu({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
          open
            ? "bg-primary/10 text-primary"
            : "text-[#475569] hover:text-[#1A1A2E] hover:bg-[#F1F5F9]"
        }`}
      >
        {label}
        <ChevronDown size={13} className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="animate-fade-in-up">
          {children}
        </div>
      )}
    </div>
  );
}

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [mobileTools, setMobileTools] = useState(false);
  const [mobileDl, setMobileDl] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 4);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => { setMenuOpen(false); setUserOpen(false); }, [pathname]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const isAdmin = session?.user?.is_admin;

  return (
    <header className={`sticky top-0 z-50 bg-white/95 backdrop-blur-md transition-all duration-300 ${
      scrolled ? "shadow-lg border-b border-[#E2E8F0]" : "border-b border-[#E2E8F0]/40"
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
        {/* Left — Logo (flex-1 so center nav is truly centered) */}
        <div className="flex-1 flex items-center min-w-0">
          <Logo size="sm" />
        </div>

        {/* Center navigation — does NOT take flex-1, stays in true center */}
        <nav className="hidden lg:flex items-center gap-1 flex-shrink-0">
          {/* Image Tools dropdown */}
          <DropdownMenu label="Image Tools">
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-80 bg-white border border-[#E2E8F0] rounded-2xl shadow-2xl py-2 z-50">
              <div className="px-4 py-2">
                <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-[1.5px]">Image Tools</p>
              </div>
              {IMAGE_TOOLS.map(({ href, label, icon: Icon, desc }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#FFF5F5] transition-all duration-150 group mx-1 rounded-xl"
                >
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/10 to-orange-500/10 flex items-center justify-center flex-shrink-0 group-hover:from-primary/20 group-hover:to-orange-500/20 transition-all duration-150">
                    <Icon size={16} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#1A1A2E] group-hover:text-primary transition-colors">{label}</p>
                    <p className="text-[11px] text-[#94A3B8] leading-tight">{desc}</p>
                  </div>
                </Link>
              ))}
              <div className="border-t border-[#E2E8F0] mt-1 mx-3" />
              <Link href="/tools" className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-primary hover:bg-[#FFF5F5] transition-colors mx-1 rounded-xl">
                <Zap size={14} />
                View All Tools
              </Link>
            </div>
          </DropdownMenu>

          {/* Downloaders dropdown */}
          <DropdownMenu label="Downloaders">
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-[340px] bg-white border border-[#E2E8F0] rounded-2xl shadow-2xl py-2 z-50">
              <div className="grid grid-cols-2 gap-0 divide-x divide-[#E2E8F0]">
                <div className="px-3 py-2">
                  <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-[1.5px] mb-2 px-1">Social Media</p>
                  {DOWNLOADERS_LEFT.map(({ href, label, warn }) => (
                    <Link
                      key={href}
                      href={href}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[#FFF5F5] transition-all duration-150 text-sm text-[#1A1A2E] hover:text-primary"
                    >
                      <Download size={12} className="text-[#94A3B8] flex-shrink-0" />
                      {label}
                      {warn && <AlertTriangle size={10} className="text-amber-400 flex-shrink-0 ml-auto" />}
                    </Link>
                  ))}
                </div>
                <div className="px-3 py-2">
                  <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-[1.5px] mb-2 px-1">Audio & Video</p>
                  {DOWNLOADERS_RIGHT.map(({ href, label }) => (
                    <Link
                      key={href}
                      href={href}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[#FFF5F5] transition-all duration-150 text-sm text-[#1A1A2E] hover:text-primary"
                    >
                      <Download size={12} className="text-[#94A3B8] flex-shrink-0" />
                      {label}
                    </Link>
                  ))}
                  <div className="border-t border-[#E2E8F0] mt-2 pt-2">
                    <Link
                      href="/downloaders"
                      className="flex items-center gap-2 px-2 py-1.5 text-xs font-bold text-primary hover:bg-[#FFF5F5] rounded-lg transition-colors"
                    >
                      All Downloaders &rarr;
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </DropdownMenu>

          {/* Nav links */}
          {[
            { href: "/how-it-works", label: "How It Works" },
            { href: "/faq",          label: "FAQ" },
            { href: "/about",        label: "About" },
          ].map(({ href, label }) => (
            <Link key={href} href={href} className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              pathname === href
                ? "bg-primary/10 text-primary"
                : "text-[#475569] hover:text-[#1A1A2E] hover:bg-[#F1F5F9]"
            }`}>
              {label}
            </Link>
          ))}
        </nav>

        {/* Right: auth (flex-1 to mirror left, justify-end to push content right) */}
        <div className="hidden lg:flex flex-1 items-center justify-end gap-2.5 min-w-0">
          {session?.user ? (
            <div ref={userRef} className="relative">
              <button
                onClick={() => setUserOpen(o => !o)}
                className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl border transition-all duration-200 text-sm font-medium ${
                  userOpen
                    ? "border-primary/30 bg-primary/5 text-primary"
                    : "border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] hover:border-[#CBD5E1] text-[#1A1A2E]"
                }`}
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/20 to-orange-500/20 flex items-center justify-center">
                  <User size={14} className="text-primary" />
                </div>
                <span className="max-w-[120px] truncate">{session.user.name || session.user.email}</span>
                {session.user.plan === "pro" && (
                  <span className="text-[9px] font-bold bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                    <Crown size={8} /> PRO
                  </span>
                )}
                <ChevronDown size={13} className={`text-muted transition-transform duration-200 ${userOpen ? "rotate-180" : ""}`} />
              </button>

              {userOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-[#E2E8F0] rounded-2xl shadow-2xl py-1.5 z-50 animate-fade-in-up">
                  <div className="px-4 py-2.5 border-b border-[#E2E8F0]">
                    <p className="text-xs font-bold text-[#1A1A2E] truncate">{session.user.name || "User"}</p>
                    <p className="text-[11px] text-[#94A3B8] truncate">{session.user.email}</p>
                  </div>
                  <div className="py-1">
                    <Link href="/dashboard" className="flex items-center gap-2.5 px-4 py-2 text-sm text-[#1A1A2E] hover:bg-[#FFF5F5] hover:text-primary transition-all duration-150 mx-1 rounded-lg">
                      <LayoutDashboard size={15} className="text-[#94A3B8]" /> Dashboard
                    </Link>
                    <Link href="/dashboard/settings" className="flex items-center gap-2.5 px-4 py-2 text-sm text-[#1A1A2E] hover:bg-[#FFF5F5] hover:text-primary transition-all duration-150 mx-1 rounded-lg">
                      <Settings size={15} className="text-[#94A3B8]" /> Account Settings
                    </Link>
                    <Link href="/dashboard/history" className="flex items-center gap-2.5 px-4 py-2 text-sm text-[#1A1A2E] hover:bg-[#FFF5F5] hover:text-primary transition-all duration-150 mx-1 rounded-lg">
                      <History size={15} className="text-[#94A3B8]" /> Conversion History
                    </Link>
                    <Link href="/support" className="flex items-center gap-2.5 px-4 py-2 text-sm text-[#1A1A2E] hover:bg-[#FFF5F5] hover:text-primary transition-all duration-150 mx-1 rounded-lg">
                      <Headphones size={15} className="text-[#94A3B8]" /> Get Support
                    </Link>
                    {session.user.plan !== "pro" && (
                      <Link href="/upgrade" className="flex items-center gap-2.5 px-4 py-2 text-sm text-amber-600 hover:bg-amber-50 transition-all duration-150 mx-1 rounded-lg font-semibold">
                        <Zap size={15} /> Upgrade to Pro
                      </Link>
                    )}
                  </div>
                  {isAdmin && (
                    <>
                      <div className="border-t border-[#E2E8F0] mx-3" />
                      <div className="py-1">
                        <Link href="/admin/inquiries" className="flex items-center gap-2.5 px-4 py-2 text-sm text-[#1A1A2E] hover:bg-[#FFF5F5] transition-all duration-150 mx-1 rounded-lg">
                          <ShieldCheck size={15} className="text-[#94A3B8]" /> Admin Panel
                        </Link>
                      </div>
                    </>
                  )}
                  <div className="border-t border-[#E2E8F0] mx-3" />
                  <div className="py-1">
                    <button onClick={() => signOut({ callbackUrl: "/" })}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-[#94A3B8] hover:text-red-600 hover:bg-red-50 transition-all duration-150 mx-1 rounded-lg">
                      <LogOut size={15} /> Log Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/auth/signin"
                className="px-4 py-2 rounded-xl text-sm font-semibold text-[#475569] hover:text-[#1A1A2E] hover:bg-[#F1F5F9] transition-all duration-200"
              >
                Log In
              </Link>
              <Link
                href="/auth/signup"
                className="px-5 py-2 rounded-xl text-sm font-bold text-white transition-all duration-200 shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: "linear-gradient(135deg, #FF4747 0%, #FF8C42 100%)" }}
              >
                Sign Up Free
              </Link>
            </div>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="lg:hidden p-2 rounded-lg text-[#475569] hover:text-[#1A1A2E] hover:bg-[#F1F5F9] transition-all duration-200"
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile full-screen drawer */}
      {menuOpen && (
        <div className="lg:hidden border-t border-[#E2E8F0] bg-white max-h-[80vh] overflow-y-auto animate-fade-in-up">
          <nav className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-0.5">
            {/* Image Tools expandable */}
            <button
              onClick={() => setMobileTools(o => !o)}
              className="flex items-center justify-between w-full px-3 py-3 rounded-xl text-sm font-semibold text-[#475569] hover:bg-[#F1F5F9] transition-all duration-200"
            >
              <span className="flex items-center gap-2"><Image size={16} className="text-primary" /> Image Tools</span>
              <ChevronDown size={14} className={`transition-transform duration-200 ${mobileTools ? "rotate-180" : ""}`} />
            </button>
            {mobileTools && (
              <div className="ml-3 pl-3 border-l-2 border-primary/20 space-y-0.5 mb-1">
                {IMAGE_TOOLS.map(({ href, label, icon: Icon }) => (
                  <Link key={href} href={href} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[#475569] hover:bg-[#FFF5F5] hover:text-primary transition-all duration-150">
                    <Icon size={14} className="text-primary/60" />
                    {label}
                  </Link>
                ))}
                <Link href="/tools" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold text-primary hover:bg-[#FFF5F5] transition-colors">
                  <Zap size={14} /> All Tools
                </Link>
              </div>
            )}

            {/* Downloaders expandable */}
            <button
              onClick={() => setMobileDl(o => !o)}
              className="flex items-center justify-between w-full px-3 py-3 rounded-xl text-sm font-semibold text-[#475569] hover:bg-[#F1F5F9] transition-all duration-200"
            >
              <span className="flex items-center gap-2"><Download size={16} className="text-primary" /> Downloaders</span>
              <ChevronDown size={14} className={`transition-transform duration-200 ${mobileDl ? "rotate-180" : ""}`} />
            </button>
            {mobileDl && (
              <div className="ml-3 pl-3 border-l-2 border-primary/20 space-y-0.5 mb-1">
                {[...DOWNLOADERS_LEFT, ...DOWNLOADERS_RIGHT].map(({ href, label }) => (
                  <Link key={href} href={href} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[#475569] hover:bg-[#FFF5F5] hover:text-primary transition-all duration-150">
                    <Download size={12} className="text-primary/60" />
                    {label}
                  </Link>
                ))}
                <Link href="/downloaders" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold text-primary hover:bg-[#FFF5F5] transition-colors">
                  All Downloaders &rarr;
                </Link>
              </div>
            )}

            {[
              { href: "/how-it-works", label: "How It Works" },
              { href: "/faq",          label: "FAQ"          },
              { href: "/about",        label: "About"        },
            ].map(({ href, label }) => (
              <Link key={href} href={href} className={`px-3 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                pathname === href ? "bg-primary/10 text-primary" : "text-[#475569] hover:text-[#1A1A2E] hover:bg-[#F1F5F9]"
              }`}>
                {label}
              </Link>
            ))}

            {/* Auth section */}
            <div className="border-t border-[#E2E8F0] mt-2 pt-3 flex flex-col gap-1">
              {session?.user ? (
                <>
                  <div className="px-3 py-2 mb-1">
                    <p className="text-xs font-bold text-[#1A1A2E]">{session.user.name || session.user.email}</p>
                    <p className="text-[11px] text-[#94A3B8]">{session.user.email}</p>
                  </div>
                  <Link href="/dashboard" className="px-3 py-2.5 rounded-xl text-sm font-medium text-[#475569] hover:bg-[#F1F5F9] flex items-center gap-2">
                    <LayoutDashboard size={15} className="text-[#94A3B8]" /> Dashboard
                  </Link>
                  <Link href="/dashboard/settings" className="px-3 py-2.5 rounded-xl text-sm font-medium text-[#475569] hover:bg-[#F1F5F9] flex items-center gap-2">
                    <Settings size={15} className="text-[#94A3B8]" /> Account Settings
                  </Link>
                  <Link href="/dashboard/history" className="px-3 py-2.5 rounded-xl text-sm font-medium text-[#475569] hover:bg-[#F1F5F9] flex items-center gap-2">
                    <History size={15} className="text-[#94A3B8]" /> Conversion History
                  </Link>
                  <Link href="/support" className="px-3 py-2.5 rounded-xl text-sm font-medium text-[#475569] hover:bg-[#F1F5F9] flex items-center gap-2">
                    <Headphones size={15} className="text-[#94A3B8]" /> Get Support
                  </Link>
                  {isAdmin && (
                    <Link href="/admin/inquiries" className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-[#475569] hover:bg-[#F1F5F9]">
                      <ShieldCheck size={15} className="text-[#94A3B8]" /> Admin Panel
                    </Link>
                  )}
                  <button onClick={() => signOut({ callbackUrl: "/" })} className="px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 text-left flex items-center gap-2 mt-1">
                    <LogOut size={15} /> Log Out
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link href="/auth/signin" className="px-4 py-2.5 rounded-xl text-sm font-semibold text-[#475569] border border-[#E2E8F0] text-center hover:bg-[#F1F5F9] transition-all duration-200">
                    Log In
                  </Link>
                  <Link href="/auth/signup" className="px-4 py-2.5 rounded-xl text-sm font-bold text-white text-center shadow-md" style={{ background: "linear-gradient(135deg, #FF4747, #FF8C42)" }}>
                    Sign Up Free
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
