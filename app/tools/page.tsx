import type { Metadata } from "next";
import Link from "next/link";
import { Minimize2, Maximize2, Crop, FileImage, Wand2, ImageIcon, Sparkles, FileOutput, Eraser, ArrowUpCircle, PenTool, Video, Layers, ArrowRight, Smartphone, Type, Wand } from "lucide-react";
import { ALL_PAIRS, getPairData } from "@/lib/conversion-pairs";

export const metadata: Metadata = {
  title: "All Free Image & Video Tools: Converter Compressor Resizer",
  description: "All free image and video tools in one place. Convert, compress, resize, crop, edit, watermark, upscale, remove background, compress video, and convert to PDF. No signup, always free.",
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
  {
    href: "/tools/ai-edit",
    icon: PenTool,
    label: "AI Image Editor",
    desc: "Edit images with AI. Describe the change you want in plain English and AI does the rest.",
    badge: "New",
    color: "bg-purple-50 text-purple-600 border-purple-100",
  },
  {
    href: "/tools/batch-convert",
    icon: Layers,
    label: "Batch Convert",
    desc: "Convert multiple images to JPG, PNG, WebP, or AVIF at once. Download as ZIP.",
    badge: "New",
    color: "bg-teal-50 text-teal-600 border-teal-100",
  },
  {
    href: "/tools/heic-to-jpg",
    icon: Smartphone,
    label: "HEIC to JPG",
    desc: "Convert iPhone HEIC photos to universal JPG format. Batch convert up to 30 files at once.",
    badge: "New",
    color: "bg-purple-50 text-purple-600 border-purple-100",
  },
  {
    href: "/tools/add-text",
    icon: Type,
    label: "Add Text to Image",
    desc: "Add captions, watermarks, and labels. 50+ fonts, shadows, outlines, batch mode. All in-browser.",
    badge: "New",
    color: "bg-rose-50 text-rose-600 border-rose-100",
  },
  {
    href: "/tools/text-to-image",
    icon: Wand,
    label: "AI Text to Image",
    desc: "Generate images from text descriptions with AI. Type what you want and download in seconds. Powered by FLUX.",
    badge: "AI",
    color: "bg-violet-50 text-violet-600 border-violet-100",
  },
  {
    href: "/tools/image-to-svg",
    icon: PenTool,
    label: "Image to SVG",
    desc: "Convert any raster image to scalable SVG vector format. B&W or color tracing with adjustable detail.",
    badge: "New",
    color: "bg-lime-50 text-lime-600 border-lime-100",
  },
  {
    href: "/tools/compress-video",
    icon: Video,
    label: "Compress Video",
    desc: "Shrink MP4, MOV, AVI, WEBM and MKV videos up to 90% smaller. Perfect for email and WhatsApp.",
    badge: "New",
    color: "bg-sky-50 text-sky-600 border-sky-100",
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
          <h1 className="text-4xl font-extrabold text-foreground">All Image & Video Tools</h1>
          <p className="text-muted max-w-xl mx-auto">
            Professional-grade image and video processing in your browser. No sign-up required. Free forever.
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

        {/* Format Conversions */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-bold text-muted uppercase tracking-wider">Format Conversions</h2>
            <Link href="/convert" className="text-xs font-bold text-primary hover:underline">
              View all &rarr;
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {ALL_PAIRS.map((pair) => {
              const d = getPairData(pair);
              if (!d) return null;
              return (
                <Link
                  key={pair}
                  href={`/convert/${pair}`}
                  className="group flex items-center justify-center gap-2 px-3 py-2.5 bg-card border border-border rounded-xl hover:border-primary/30 hover:shadow-sm transition-all"
                >
                  <span className="text-xs font-bold text-foreground">{d.from}</span>
                  <ArrowRight size={12} className="text-muted group-hover:text-primary transition-colors" />
                  <span className="text-xs font-bold text-primary">{d.to}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
