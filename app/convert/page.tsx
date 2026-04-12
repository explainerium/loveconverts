import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getPairsBySource } from "@/lib/conversion-pairs";

export const metadata: Metadata = {
  title: "Free Online Image Converter - All Format Conversions | LoveConverts",
  description:
    "Convert images between JPG, PNG, WebP, AVIF, GIF, TIFF, BMP, and ICO. All conversions are free, instant, and require no signup. Pick your source and target format below.",
  alternates: { canonical: "https://loveconverts.com/convert" },
  openGraph: {
    title: "Free Online Image Converter - All Format Conversions | LoveConverts",
    description:
      "Convert images between JPG, PNG, WebP, AVIF, GIF, TIFF, BMP, and ICO. Free, instant, no signup.",
    url: "https://loveconverts.com/convert",
  },
};

const FORMAT_COLORS: Record<string, string> = {
  WebP:  "bg-blue-50 text-blue-700 border-blue-200",
  PNG:   "bg-green-50 text-green-700 border-green-200",
  JPG:   "bg-amber-50 text-amber-700 border-amber-200",
  AVIF:  "bg-violet-50 text-violet-700 border-violet-200",
  GIF:   "bg-pink-50 text-pink-700 border-pink-200",
  TIFF:  "bg-orange-50 text-orange-700 border-orange-200",
  BMP:   "bg-slate-50 text-slate-700 border-slate-200",
  ICO:   "bg-cyan-50 text-cyan-700 border-cyan-200",
};

export default function ConvertIndexPage() {
  const groups = getPairsBySource();
  const sourceOrder = ["WebP", "PNG", "JPG", "AVIF", "GIF", "TIFF", "BMP", "ICO"];

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-5xl mx-auto px-4 space-y-12">
        {/* Hero */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 bg-primary-light text-primary text-xs font-bold px-3 py-1 rounded-full">
            All Conversions
          </div>
          <h1 className="text-4xl font-extrabold text-foreground">
            Image Format Conversions
          </h1>
          <p className="text-muted max-w-xl mx-auto">
            Convert between any image format for free. No signup, no watermarks. Pick your source format below
            and choose your target.
          </p>
        </div>

        {/* Grouped by source */}
        {sourceOrder.map((source) => {
          const pairs = groups[source];
          if (!pairs || pairs.length === 0) return null;
          const color = FORMAT_COLORS[source] || "bg-gray-50 text-gray-700 border-gray-200";

          return (
            <div key={source}>
              <div className="flex items-center gap-3 mb-4">
                <span className={`px-3 py-1 rounded-lg text-sm font-bold border ${color}`}>
                  {source}
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {pairs.map((p) => (
                  <Link
                    key={p.pair}
                    href={`/convert/${p.pair}`}
                    className="group flex items-center justify-between px-4 py-3.5 bg-card border border-border rounded-xl hover:border-primary/30 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground">{p.from}</span>
                      <ArrowRight size={14} className="text-muted group-hover:text-primary transition-colors" />
                      <span className="text-sm font-bold text-primary">{p.to}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
