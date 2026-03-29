import type { Metadata } from "next";
import Link from "next/link";
import {
  Upload,
  Settings2,
  Download,
  Zap,
  Shield,
  Server,
  Layers,
} from "lucide-react";

export const metadata: Metadata = {
  title: "How It Works — Image Converter & Video Downloader",
  description:
    "Learn how LoveConverts converts images and downloads videos. Three simple steps: upload or paste a link, choose settings, download instantly.",
  alternates: { canonical: "https://loveconverts.com/how-it-works" },
};

const STEPS = [
  {
    icon: Upload,
    step: "01",
    title: "Upload your images",
    desc: "Drag & drop or click to browse. You can upload multiple images at once. Supports JPG, PNG, WEBP, GIF, BMP, TIFF, AVIF, ICO up to 20 MB each.",
    color: "bg-blue-50 text-blue-600",
    border: "border-blue-200",
  },
  {
    icon: Settings2,
    step: "02",
    title: "Choose format & settings",
    desc: "Pick your target format from 7 options. Adjust quality, resize dimensions, rotate, flip, apply grayscale, and more — all optional.",
    color: "bg-orange-50 text-orange-600",
    border: "border-orange-200",
  },
  {
    icon: Download,
    step: "03",
    title: "Convert & download",
    desc: "Hit Convert and your images are processed server-side using Sharp. Download individually or grab all as a ZIP bundle.",
    color: "bg-green-50 text-green-700",
    border: "border-green-200",
  },
];

const FEATURES = [
  {
    icon: Zap,
    title: "100% Free",
    desc: "No paywalls, no credits, no premium tiers. Convert as many images as you need.",
    color: "text-yellow-500",
    bg: "bg-yellow-50",
  },
  {
    icon: Shield,
    title: "No Sign-up",
    desc: "No account required. No email, no password. Just open the tool and start converting.",
    color: "text-primary",
    bg: "bg-primary-light",
  },
  {
    icon: Server,
    title: "Server-side Processing",
    desc: "Conversions happen on our server using Sharp — high quality, fast, and reliable.",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    icon: Layers,
    title: "8+ Formats Supported",
    desc: "JPG, PNG, WEBP, GIF, TIFF, AVIF, ICO — and more input formats like BMP and SVG.",
    color: "text-green-600",
    bg: "bg-green-50",
  },
];

const FORMATS = [
  { ext: "JPG", name: "JPEG", desc: "Lossy compression, best for photos", use: "Photos & social media" },
  { ext: "PNG", name: "PNG", desc: "Lossless, supports transparency", use: "Graphics, logos, UI" },
  { ext: "WEBP", name: "WebP", desc: "~30% smaller than JPG at same quality", use: "Web images, thumbnails" },
  { ext: "AVIF", name: "AVIF", desc: "Next-gen, excellent compression", use: "Modern web (Chrome/Firefox)" },
  { ext: "GIF", name: "GIF", desc: "Animation support, 256 colors", use: "Simple animations" },
  { ext: "TIFF", name: "TIFF", desc: "Lossless, very large files", use: "Print, archiving" },
  { ext: "ICO", name: "ICO", desc: "Windows icon format", use: "Favicons, app icons" },
];

export default function HowItWorksPage() {
  return (
    <div className="bg-background">
      {/* Hero */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pt-14 pb-10 text-center space-y-4">
        <span className="inline-block px-4 py-1 rounded-full bg-primary-light text-primary text-sm font-semibold border border-primary/20">
          Simple 3-step process
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-foreground">
          How It Works
        </h1>
        <p className="text-muted text-lg max-w-xl mx-auto">
          LoveConverts makes image conversion dead simple. No complicated settings,
          no waiting — just results.
        </p>
      </section>

      {/* Steps */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {STEPS.map(({ icon: Icon, step, title, desc, color, border }) => (
            <div
              key={step}
              className={`bg-card rounded-2xl border ${border} p-6 space-y-4 shadow-sm hover:shadow-md transition-shadow`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                  <Icon size={20} />
                </div>
                <span className="text-3xl font-black text-gray-100">{step}</span>
              </div>
              <h2 className="text-lg font-bold text-foreground">{title}</h2>
              <p className="text-muted text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-10 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl text-base font-bold text-white bg-gradient-to-r from-primary to-orange-500 hover:from-primary-hover hover:to-orange-600 shadow-md transition-all active:scale-95"
          >
            <Upload size={18} />
            Try it now — it&apos;s free
          </Link>
        </div>
      </section>

      {/* Why section */}
      <section className="bg-card border-y border-border py-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-extrabold text-foreground text-center mb-10">
            Why LoveConverts?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc, color, bg }) => (
              <div key={title} className="space-y-3">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${bg}`}>
                  <Icon size={22} className={color} />
                </div>
                <h3 className="font-bold text-foreground">{title}</h3>
                <p className="text-muted text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Supported Formats */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="text-3xl font-extrabold text-foreground text-center mb-3">
          Supported Formats
        </h2>
        <p className="text-muted text-center mb-10">
          All output formats below. Input also accepts BMP, SVG, and more.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {FORMATS.map(({ ext, name, desc, use }) => (
            <div
              key={ext}
              className="bg-card border border-border rounded-2xl p-5 hover:border-primary/40 hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2.5 py-1 rounded-lg bg-primary text-white text-xs font-black">{ext}</span>
                <span className="text-sm font-semibold text-foreground">{name}</span>
              </div>
              <p className="text-sm text-muted leading-snug">{desc}</p>
              <p className="text-xs text-primary font-medium mt-2">Best for: {use}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
