import Link from "next/link";
import { Minimize2, Maximize2, Crop, Eraser } from "lucide-react";
import JsonLd from "@/app/components/JsonLd";
import AddTextEditor from "./AddTextEditor";

const FAQ = [
  {
    q: "Is this tool completely free?",
    a: "Yes. No signup, no watermark on the downloaded image, no hidden limits. All processing happens in your browser, nothing is uploaded to any server.",
  },
  {
    q: "Can I add text to multiple images at once?",
    a: "Yes. Switch to Batch Mode, upload up to 30 images, configure your text settings once, and download all results as a single ZIP file. No other free tool does this.",
  },
  {
    q: "What fonts are available?",
    a: "Over 50 carefully selected Google Fonts across five categories: sans-serif, serif, display, handwriting, and monospace. All load directly in your browser.",
  },
  {
    q: "Can I add more than one line of text?",
    a: "Yes. You can add multiple text layers, each with completely different fonts, colors, sizes, and positions. Use the Text Layers panel to manage them.",
  },
  {
    q: "Does LoveConverts store my images?",
    a: "No. This tool runs entirely in your browser. Your images never leave your device and are never uploaded to any server.",
  },
  {
    q: "What image formats are supported?",
    a: "You can upload JPG, PNG, WEBP, GIF, and BMP files up to 20MB. Output is available as PNG or JPG.",
  },
];

const ARTICLE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Add Text to Image Free Online",
  description:
    "Free browser-based tool to add text, captions, and watermarks to images with no signup or watermark.",
  author: { "@type": "Organization", name: "LoveConverts" },
  publisher: {
    "@type": "Organization",
    name: "LoveConverts",
    url: "https://loveconverts.com",
  },
  datePublished: "2026-04-13",
  dateModified: "2026-04-13",
};

const FAQ_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

const BREADCRUMB_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://loveconverts.com" },
    { "@type": "ListItem", position: 2, name: "Tools", item: "https://loveconverts.com/tools" },
    {
      "@type": "ListItem",
      position: 3,
      name: "Add Text to Image",
      item: "https://loveconverts.com/tools/add-text",
    },
  ],
};

export default function AddTextPage() {
  return (
    <div className="min-h-screen bg-background">
      <JsonLd data={ARTICLE_SCHEMA} />
      <JsonLd data={FAQ_SCHEMA} />
      <JsonLd data={BREADCRUMB_SCHEMA} />

      {/* Hero */}
      <div className="max-w-6xl mx-auto px-4 pt-12 pb-4 text-center">
        <h1 className="text-4xl font-extrabold text-foreground">Add Text to Image</h1>
        <p className="text-muted max-w-xl mx-auto mt-3">
          Free, no signup. Add captions, watermarks, and labels to one image or dozens at once.
        </p>
      </div>

      {/* Editor */}
      <AddTextEditor />

      {/* FAQ */}
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h2 className="text-xl font-bold text-foreground mb-6">Frequently Asked Questions</h2>
        <div className="space-y-3">
          {FAQ.map((f, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-semibold text-foreground mb-2 text-sm">{f.q}</h3>
              <p className="text-sm text-muted leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Related Tools */}
      <div className="max-w-3xl mx-auto px-4 pb-12">
        <h3 className="text-sm font-bold text-muted uppercase tracking-wider mb-3">Related Tools</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: "/tools/crop", icon: Crop, label: "Crop Image" },
            { href: "/tools/resize", icon: Maximize2, label: "Resize Image" },
            { href: "/tools/remove-background", icon: Eraser, label: "Remove Background" },
            { href: "/tools/compress", icon: Minimize2, label: "Compress Image" },
          ].map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-2 p-3 rounded-xl border border-border hover:border-primary/30 hover:shadow-sm transition-all text-center group"
            >
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Icon size={16} className="text-primary" />
              </div>
              <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                {label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
