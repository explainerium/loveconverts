import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import ImageConverter from "./components/ImageConverter";
import RecentConversions from "./components/RecentConversions";
import JsonLd from "./components/JsonLd";

const POPULAR_CONVERSIONS = [
  { pair: "webp-to-jpg", from: "WebP", to: "JPG" },
  { pair: "png-to-jpg", from: "PNG", to: "JPG" },
  { pair: "jpg-to-png", from: "JPG", to: "PNG" },
  { pair: "jpg-to-webp", from: "JPG", to: "WebP" },
  { pair: "webp-to-png", from: "WebP", to: "PNG" },
  { pair: "png-to-webp", from: "PNG", to: "WebP" },
  { pair: "avif-to-jpg", from: "AVIF", to: "JPG" },
  { pair: "gif-to-jpg", from: "GIF", to: "JPG" },
  { pair: "tiff-to-jpg", from: "TIFF", to: "JPG" },
  { pair: "bmp-to-jpg", from: "BMP", to: "JPG" },
  { pair: "jpg-to-avif", from: "JPG", to: "AVIF" },
  { pair: "png-to-avif", from: "PNG", to: "AVIF" },
];

export const metadata: Metadata = {
  title: "Free Image Converter: JPG PNG WEBP AVIF Online",
  description:
    "Convert images between JPG, PNG, WEBP, AVIF, GIF, BMP, TIFF and ICO formats. Free, fast, server-side processing. No signup. No file storage.",
  openGraph: {
    title: "Free Image Converter: JPG PNG WEBP AVIF Online",
    description:
      "Convert images between JPG, PNG, WEBP, AVIF, GIF, BMP, TIFF and ICO formats. Free, fast, server-side processing. No signup. No file storage.",
    url: "https://loveconverts.com",
  },
  alternates: { canonical: "https://loveconverts.com" },
};

export default function Page() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "LoveConverts",
          url: "https://loveconverts.com",
          description: "Free online image converter and social media downloader",
          potentialAction: {
            "@type": "SearchAction",
            target: {
              "@type": "EntryPoint",
              urlTemplate: "https://loveconverts.com/?q={search_term_string}",
            },
            "query-input": "required name=search_term_string",
          },
        }}
      />
      <ImageConverter />

      {/* Recent conversions (localStorage only) */}
      <RecentConversions />

      {/* Popular Conversions */}
      <div className="max-w-3xl mx-auto px-4 pb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-muted uppercase tracking-wider">Popular Conversions</h2>
          <Link href="/convert" className="text-xs font-bold text-primary hover:underline">
            View all &rarr;
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {POPULAR_CONVERSIONS.map(({ pair, from, to }) => (
            <Link
              key={pair}
              href={`/convert/${pair}`}
              className="group flex items-center justify-center gap-1.5 px-3 py-2.5 bg-card border border-border rounded-xl hover:border-primary/30 hover:shadow-sm transition-all"
            >
              <span className="text-xs font-bold text-foreground">{from}</span>
              <ArrowRight size={12} className="text-muted group-hover:text-primary transition-colors" />
              <span className="text-xs font-bold text-primary">{to}</span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
