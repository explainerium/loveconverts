import Link from "next/link";
import { Wand2, Sparkles, Type as TypeIcon, ImageIcon } from "lucide-react";
import JsonLd from "@/app/components/JsonLd";
import TextToImageClient from "./TextToImageClient";

const FAQ = [
  {
    q: "Is the AI image generator free?",
    a: "Yes, completely free. No signup required and no watermark on generated images.",
  },
  {
    q: "Who owns the generated images?",
    a: "You do. Images generated with this tool are yours to use for personal or commercial purposes.",
  },
  {
    q: "How long does generation take?",
    a: "Usually 3 to 8 seconds. The FLUX model is optimized for speed without sacrificing quality.",
  },
  {
    q: "What makes a good prompt?",
    a: "Specific prompts produce better results. Include the subject, setting, lighting style, mood, and artistic style. \"A red bicycle leaning against a Paris cafe wall, morning light, film photography\" works better than \"a bicycle\".",
  },
  {
    q: "Can I generate multiple images at once?",
    a: "Currently one image per generation. Click \"Generate Another\" to create variations of the same prompt.",
  },
  {
    q: "What resolution are the generated images?",
    a: "Images are generated at up to 1024x1024px for square format, scaled proportionally for other aspect ratios.",
  },
];

const ARTICLE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "AI Text to Image Generator",
  description:
    "Free AI tool to generate images from plain English text descriptions. Powered by FLUX Schnell.",
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
      name: "Text to Image Generator",
      item: "https://loveconverts.com/tools/text-to-image",
    },
  ],
};

export default function TextToImagePage() {
  return (
    <div className="min-h-screen bg-background">
      <JsonLd data={ARTICLE_SCHEMA} />
      <JsonLd data={FAQ_SCHEMA} />
      <JsonLd data={BREADCRUMB_SCHEMA} />

      {/* Hero */}
      <div className="max-w-4xl mx-auto px-4 pt-12 pb-4 text-center">
        <div className="inline-flex items-center gap-2 text-xs font-bold text-violet-700 bg-violet-50 px-3 py-1 rounded-full mb-3">
          <Sparkles size={12} /> Powered by FLUX AI
        </div>
        <h1 className="text-4xl font-extrabold text-foreground">AI Text to Image Generator</h1>
        <p className="text-muted max-w-xl mx-auto mt-3">
          Describe any image in plain English and AI will create it in seconds.
          Free, no signup required.
        </p>
      </div>

      <TextToImageClient />

      {/* How it works */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="font-bold text-foreground mb-4">How it works</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { step: "1", title: "Describe", desc: "Type what you want to see. Be specific: colors, lighting, style, and mood all help." },
              { step: "2", title: "Generate", desc: "Our AI model processes your description and creates a unique image in seconds." },
              { step: "3", title: "Download", desc: "Download your image free in WebP or PNG format. No watermark, no signup." },
            ].map(({ step, title, desc }) => (
              <div key={step} className="space-y-2">
                <div className="w-8 h-8 rounded-full bg-primary text-white text-sm font-bold flex items-center justify-center mx-auto">
                  {step}
                </div>
                <p className="text-sm font-semibold text-foreground">{title}</p>
                <p className="text-xs text-muted">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-3xl mx-auto px-4 py-8">
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
            { href: "/tools/ai-edit", icon: Wand2, label: "AI Image Editor" },
            { href: "/tools/enhance", icon: Sparkles, label: "AI Enhance" },
            { href: "/tools/add-text", icon: TypeIcon, label: "Add Text to Image" },
            { href: "/", icon: ImageIcon, label: "Image Converter" },
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
