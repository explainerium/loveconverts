"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown, ImageIcon, Minimize2, Maximize2, Crop, Wand2, FileImage, Sparkles,
  Eraser, Droplets, FileOutput, FileInput, ArrowUpCircle, Stamp, Layers,
} from "lucide-react";

const TOOLS = [
  { href: "/tools/compress",       label: "COMPRESS",       icon: Minimize2 },
  { href: "/tools/resize",         label: "RESIZE",         icon: Maximize2 },
  { href: "/tools/crop",           label: "CROP",           icon: Crop      },
  { href: "/tools/convert-to-jpg", label: "CONVERT TO JPG", icon: FileImage },
  { href: "/tools/photo-editor",   label: "PHOTO EDITOR",   icon: Wand2     },
  { href: "/tools/enhance",        label: "AI ENHANCE",     icon: Sparkles  },
];

const MORE_AVAILABLE = [
  { href: "/tools/enhance",        label: "AI Enhance",      icon: Sparkles,  desc: "Upscale & enhance" },
  { href: "/tools/compress",       label: "Compress Image",  icon: Minimize2, desc: "Reduce file size" },
  { href: "/tools/resize",         label: "Resize Image",    icon: Maximize2, desc: "Change dimensions" },
  { href: "/tools/crop",           label: "Crop Image",      icon: Crop,      desc: "Trim to selection" },
  { href: "/tools/convert-to-jpg", label: "Convert to JPG",  icon: FileImage, desc: "Universal format" },
  { href: "/tools/photo-editor",   label: "Photo Editor",    icon: Wand2,     desc: "Adjust & filter" },
];

const COMING_SOON = [
  { label: "Remove Background",    icon: Eraser,         desc: "AI-powered removal" },
  { label: "Add Watermark",        icon: Stamp,          desc: "Protect your images" },
  { label: "Image to PDF",         icon: FileOutput,     desc: "Bundle into PDF" },
  { label: "PDF to Image",         icon: FileInput,      desc: "Extract pages" },
  { label: "Upscale Image (AI)",   icon: ArrowUpCircle,  desc: "Enlarge with AI" },
  { label: "Batch Convert",        icon: Layers,         desc: "Process multiple files" },
];

export default function ToolsNav() {
  const pathname  = usePathname();
  const [open, setOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="sticky top-16 z-30 bg-white/95 backdrop-blur-md border-b border-border shadow-sm">
      <div className="max-w-[1400px] mx-auto px-4">
        <div className="flex items-center overflow-x-auto scrollbar-hide">
          {/* Home tool link */}
          <Link
            href="/"
            className={`flex items-center gap-1.5 px-3 py-3.5 text-[11px] font-bold tracking-widest whitespace-nowrap border-b-2 transition-all duration-200 ${
              pathname === "/"
                ? "border-primary text-primary"
                : "border-transparent text-muted hover:text-foreground hover:border-primary/30"
            }`}
          >
            <ImageIcon size={13} />
            CONVERT
          </Link>

          <div className="w-px h-4 bg-border mx-1 flex-shrink-0" />

          {TOOLS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3 py-3.5 text-[11px] font-bold tracking-widest whitespace-nowrap border-b-2 transition-all duration-200 ${
                  active
                    ? "border-primary text-primary"
                    : "border-transparent text-muted hover:text-foreground hover:border-primary/30"
                }`}
              >
                <Icon size={12} className="hidden sm:block" />
                {label}
              </Link>
            );
          })}

          {/* More tools dropdown */}
          <div className="relative flex-shrink-0" ref={dropRef}>
            <button
              onClick={() => setOpen((o) => !o)}
              className={`flex items-center gap-1 px-3 py-3.5 text-[11px] font-bold tracking-widest whitespace-nowrap border-b-2 transition-all duration-200 ${
                open
                  ? "border-primary text-primary"
                  : "border-transparent text-muted hover:text-foreground hover:border-primary/30"
              }`}
            >
              MORE TOOLS
              <ChevronDown size={12} className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
            </button>

            {open && (
              <div className="absolute top-full right-0 mt-1 w-72 bg-white border border-[#E2E8F0] rounded-2xl shadow-2xl py-2 z-50 animate-fade-in-up">
                {/* Available tools */}
                <div className="px-3 py-1.5">
                  <p className="text-[10px] font-bold text-[#94A3B8] tracking-[1.5px] uppercase">Available Tools</p>
                </div>
                {MORE_AVAILABLE.map(({ href, label, icon: Icon, desc }) => (
                  <Link key={href} href={href} onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-[#FFF5F5] transition-all duration-150 mx-1 rounded-xl group">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                      <Icon size={14} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#1A1A2E] group-hover:text-primary transition-colors">{label}</p>
                      <p className="text-[10px] text-[#94A3B8]">{desc}</p>
                    </div>
                  </Link>
                ))}

                <div className="border-t border-[#E2E8F0] my-1.5 mx-3" />

                {/* Coming Soon */}
                <div className="px-3 py-1.5">
                  <p className="text-[10px] font-bold text-[#94A3B8] tracking-[1.5px] uppercase">Coming Soon</p>
                </div>
                {COMING_SOON.map(({ label, icon: Icon, desc }) => (
                  <div key={label} className="flex items-center gap-3 px-3 py-2 mx-1 rounded-xl opacity-50 cursor-default">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <Icon size={14} className="text-[#94A3B8]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#64748B]">{label}</p>
                      <p className="text-[10px] text-[#94A3B8]">{desc}</p>
                    </div>
                    <span className="text-[8px] font-bold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full flex-shrink-0">SOON</span>
                  </div>
                ))}

                <div className="border-t border-[#E2E8F0] mt-1.5 mx-3" />
                <div className="px-3 py-2">
                  <Link href="/tools" onClick={() => setOpen(false)}
                    className="text-sm text-primary font-bold hover:underline flex items-center gap-1">
                    <Droplets size={13} />
                    View all tools &rarr;
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
