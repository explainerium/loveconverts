"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown, ImageIcon, Minimize2, Maximize2, Crop, Wand2, FileImage, Sparkles,
  Eraser, Droplets, FileOutput, FileInput, ArrowUpCircle, Layers, Video, Zap, Type, Wand, Smartphone, PenTool,
} from "lucide-react";

const TOOLS = [
  { href: "/tools/compress",       label: "COMPRESS",       icon: Minimize2 },
  { href: "/tools/resize",         label: "RESIZE",         icon: Maximize2 },
  { href: "/tools/crop",           label: "CROP",           icon: Crop      },
  { href: "/tools/convert-to-jpg", label: "CONVERT TO JPG", icon: FileImage },
  { href: "/tools/photo-editor",   label: "PHOTO EDITOR",   icon: Wand2     },
  { href: "/tools/enhance",        label: "AI ENHANCE",     icon: Sparkles  },
  { href: "/tools/compress-video", label: "COMPRESS VIDEO", icon: Video     },
];

const MORE_TOOLS = [
  { href: "/tools/text-to-image",     label: "AI Text to Image",  icon: Wand,           desc: "Generate images from text" },
  { href: "/tools/add-text",          label: "Add Text to Image", icon: Type,           desc: "Add captions, watermarks, labels" },
  { href: "/tools/heic-to-jpg",       label: "HEIC to JPG",       icon: Smartphone,     desc: "Convert iPhone HEIC photos" },
  { href: "/tools/remove-background", label: "Remove Background", icon: Eraser,         desc: "Remove image backgrounds" },
  { href: "/tools/upscale",           label: "Upscale Image",     icon: ArrowUpCircle,  desc: "Enlarge with sharpening" },
  { href: "/tools/image-to-pdf",      label: "Image to PDF",      icon: FileOutput,     desc: "Bundle images into PDF" },
  { href: "/tools/pdf-to-image",      label: "PDF to Image",      icon: FileInput,      desc: "Extract pages as images" },
  { href: "/tools/batch-convert",     label: "Batch Convert",     icon: Layers,         desc: "Convert multiple files" },
  { href: "/tools/image-to-svg",      label: "Image to SVG",      icon: PenTool,        desc: "Vectorize images to SVG" },
  { href: "/tools/compress-video",    label: "Compress Video",    icon: Video,          desc: "Shrink MP4, MOV, WEBM" },
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
        <div className="flex items-center justify-center">
          {/* Scrollable tool row */}
          <div className="flex items-center overflow-x-auto scrollbar-hide min-w-0">
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
          </div>

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
                <div className="px-3 py-1.5">
                  <p className="text-[10px] font-bold text-[#94A3B8] tracking-[1.5px] uppercase">All Tools</p>
                </div>
                {MORE_TOOLS.map(({ href, label, icon: Icon, desc }) => (
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

                <div className="border-t border-[#E2E8F0] mt-1.5 mx-3" />
                <div className="px-3 py-2">
                  <Link href="/tools" onClick={() => setOpen(false)}
                    className="text-sm text-primary font-bold hover:underline flex items-center gap-1">
                    <Zap size={13} />
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
