import type { Metadata } from "next";
import Link from "next/link";
import { Minimize2, Maximize2, Crop, FileImage, Wand2, ImageIcon, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "All Free Image Tools — Converter Compressor Resizer",
  description: "All free image tools in one place. Convert, compress, resize, crop and edit images online. No signup, no file storage, always free.",
  alternates: { canonical: "https://loveconverts.com/tools" },
  openGraph: { url: "https://loveconverts.com/tools" },
};

const TOOLS = [
  {
    href: "/tools/compress",
    icon: Minimize2,
    label: "Compress Image",
    desc: "Reduce file size while keeping quality high. Supports JPG, PNG, WEBP, and AVIF.",
    badge: "Popular",
    color: "bg-blue-50 text-blue-600 border-blue-100",
  },
  {
    href: "/tools/resize",
    icon: Maximize2,
    label: "Resize Image",
    desc: "Change image dimensions to any size with social media presets included.",
    badge: null,
    color: "bg-violet-50 text-violet-600 border-violet-100",
  },
  {
    href: "/tools/crop",
    icon: Crop,
    label: "Crop Image",
    desc: "Trim and crop images with precision. Choose from common aspect ratios.",
    badge: null,
    color: "bg-orange-50 text-orange-600 border-orange-100",
  },
  {
    href: "/tools/convert-to-jpg",
    icon: FileImage,
    label: "Convert to JPG",
    desc: "Convert PNG, WEBP, AVIF, GIF, BMP, and TIFF to JPG format.",
    badge: null,
    color: "bg-amber-50 text-amber-600 border-amber-100",
  },
  {
    href: "/tools/photo-editor",
    icon: Wand2,
    label: "Photo Editor",
    desc: "Adjust brightness, contrast, saturation, sharpness, and apply filters.",
    badge: null,
    color: "bg-green-50 text-green-600 border-green-100",
  },
  {
    href: "/tools/enhance",
    icon: Sparkles,
    label: "AI Enhance",
    desc: "Upscale 2x/4x, denoise, sharpen, HDR, portrait mode, and auto-enhance.",
    badge: "New",
    color: "bg-violet-50 text-violet-600 border-violet-100",
  },
  {
    href: "/",
    icon: ImageIcon,
    label: "Convert Image",
    desc: "Convert between JPG, PNG, WEBP, AVIF, GIF, BMP, TIFF, ICO and more.",
    badge: null,
    color: "bg-primary-light text-primary border-primary/20",
  },
];

const COMING_SOON = [
  { label: "Remove Background", desc: "AI-powered background removal" },
  { label: "Add Watermark",     desc: "Protect your images with a watermark" },
  { label: "Image to PDF",      desc: "Bundle images into a PDF document" },
  { label: "PDF to Image",      desc: "Extract pages from PDF as images" },
  { label: "Upscale Image (AI)", desc: "Enlarge images with AI upscaling" },
];

export default function ToolsPage() {
  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-5xl mx-auto px-4 space-y-12">
        {/* Hero */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 bg-primary-light text-primary text-xs font-bold px-3 py-1 rounded-full">
            ✦ Free Tools
          </div>
          <h1 className="text-4xl font-extrabold text-foreground">All Image Tools</h1>
          <p className="text-muted max-w-xl mx-auto">
            Professional-grade image processing in your browser. No sign-up required. Free forever.
          </p>
        </div>

        {/* Available tools */}
        <div>
          <h2 className="text-sm font-bold text-muted uppercase tracking-wider mb-5">Available Now</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {TOOLS.map(({ href, icon: Icon, label, desc, badge, color }) => (
              <Link key={href} href={href}
                className="group bg-card border border-border rounded-2xl p-5 hover:shadow-md hover:border-primary/30 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${color}`}>
                    <Icon size={18} />
                  </div>
                  {badge && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      badge === "New"
                        ? "bg-green-100 text-green-700"
                        : "bg-primary-light text-primary"
                    }`}>
                      {badge}
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">{label}</h3>
                <p className="text-sm text-muted mt-1 leading-relaxed">{desc}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Coming soon */}
        <div>
          <h2 className="text-sm font-bold text-muted uppercase tracking-wider mb-5">Coming Soon</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {COMING_SOON.map(({ label, desc }) => (
              <div key={label} className="bg-card border border-border rounded-2xl p-5 opacity-60">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl border border-border bg-gray-50 flex items-center justify-center">
                    <ImageIcon size={18} className="text-gray-400" />
                  </div>
                  <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">SOON</span>
                </div>
                <h3 className="font-bold text-foreground">{label}</h3>
                <p className="text-sm text-muted mt-1">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
