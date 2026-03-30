import type { Metadata } from "next";
import Link from "next/link";
import { Minimize2, Maximize2, Crop, FileImage, Wand2, ImageIcon, Sparkles, Droplets, FileOutput, Eraser, ArrowUpCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "All Free Image Tools: Converter Compressor Resizer",
  description: "All free image tools in one place. Convert, compress, resize, crop, edit, watermark, upscale, remove background, and convert to PDF. No signup, always free.",
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
    badge: null,
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
  {
    href: "/tools/remove-background",
    icon: Eraser,
    label: "Remove Background",
    desc: "Remove image backgrounds and get a transparent PNG. Adjust sensitivity.",
    badge: "New",
    color: "bg-pink-50 text-pink-600 border-pink-100",
  },
  {
    href: "/tools/watermark",
    icon: Droplets,
    label: "Add Watermark",
    desc: "Add text watermarks to your images. Choose position, opacity, size, and color.",
    badge: "New",
    color: "bg-cyan-50 text-cyan-600 border-cyan-100",
  },
  {
    href: "/tools/image-to-pdf",
    icon: FileImage,
    label: "Image to PDF",
    desc: "Combine multiple images into a single PDF document with page size options.",
    badge: "New",
    color: "bg-red-50 text-red-600 border-red-100",
  },
  {
    href: "/tools/pdf-to-image",
    icon: FileOutput,
    label: "PDF to Image",
    desc: "Extract pages from a PDF as JPG or PNG images. Select pages or convert all.",
    badge: "New",
    color: "bg-indigo-50 text-indigo-600 border-indigo-100",
  },
  {
    href: "/tools/upscale",
    icon: ArrowUpCircle,
    label: "Upscale Image",
    desc: "Enlarge images 2x or 4x using Lanczos3 resampling. Keep sharpness at higher resolution.",
    badge: "New",
    color: "bg-emerald-50 text-emerald-600 border-emerald-100",
  },
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

        {/* All tools */}
        <div>
          <h2 className="text-sm font-bold text-muted uppercase tracking-wider mb-5">Available Now</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {TOOLS.map(({ href, icon: Icon, label, desc, badge, color }) => (
              <Link key={label} href={href}
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
      </div>
    </div>
  );
}
