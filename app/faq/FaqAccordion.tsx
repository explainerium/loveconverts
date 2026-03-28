"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import Link from "next/link";

const FAQS = [
  {
    q: "Is LoveConverts really free?",
    a: "Yes, completely free. No credits, no subscription, no hidden costs. You can convert as many images as you want without spending a cent.",
  },
  {
    q: "Are my files stored on your server?",
    a: "No. Your images are processed entirely in memory and are never written to disk. Once the conversion is done, the data is discarded. We do not store, log, or access your images in any way.",
  },
  {
    q: "What is the maximum file size?",
    a: "Each individual file can be up to 20 MB. There is no limit on how many files you can convert in a session, but very large batches may be slower.",
  },
  {
    q: "What formats are supported?",
    a: "Output formats: JPG, PNG, WEBP, AVIF, GIF, TIFF, and ICO. Input formats include all of the above plus BMP, SVG, and most common image formats.",
  },
  {
    q: "What is WebP and should I use it?",
    a: "WebP is a modern image format developed by Google. It produces files about 25–34% smaller than JPEG at equivalent quality, while also supporting transparency like PNG. It's ideal for websites and web apps — all modern browsers support it.",
  },
  {
    q: "Can I convert multiple files at once?",
    a: "Yes. You can upload as many images as you like in one session. All images will be converted with your chosen settings, and you can download them individually or as a single ZIP file.",
  },
  {
    q: "Why is my converted file larger than the original?",
    a: "This can happen when converting from a lossy format (like JPG) to a lossless format (like PNG or TIFF), or when increasing quality above the original encoding. Lossless formats store more image data, resulting in larger files. Try lowering the quality slider or using a lossy output format to reduce file size.",
  },
  {
    q: "What is AVIF format?",
    a: "AVIF is a next-generation image format offering significantly better compression than both JPEG and WebP. It supports HDR, wide color gamut, and transparency. It's fully supported in Chrome, Firefox, and Safari — though it may not be supported by all software or older browsers.",
  },
  {
    q: "Does LoveConverts work on mobile?",
    a: "Yes. LoveConverts is fully responsive and works on smartphones and tablets. You can upload images directly from your camera roll or file system on iOS and Android.",
  },
  {
    q: "Is there a rate limit?",
    a: "There is no enforced rate limit for normal usage. However, very large batches or unusually high traffic may slow things down for everyone, so please be considerate.",
  },
  {
    q: "What technology powers LoveConverts?",
    a: "LoveConverts is built with Next.js and TypeScript on the frontend, and uses the Sharp image processing library (a high-performance Node.js module built on libvips) on the server side.",
  },
  {
    q: "Do I need to install anything?",
    a: "No. LoveConverts runs entirely in your browser — there is nothing to install or configure. Just open the page and start converting.",
  },
];

function AccordionItem({
  q,
  a,
  isOpen,
  onToggle,
}: {
  q: string;
  a: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-border last:border-0">
      <button
        className="w-full flex items-center justify-between gap-4 py-5 px-1 text-left group"
        onClick={onToggle}
        aria-expanded={isOpen}
        type="button"
      >
        <span
          className={`text-[15px] font-semibold transition-colors ${
            isOpen ? "text-primary" : "text-foreground group-hover:text-primary"
          }`}
        >
          {q}
        </span>
        <ChevronDown
          size={18}
          className={`flex-shrink-0 text-muted transition-transform duration-300 ${
            isOpen ? "rotate-180 text-primary" : ""
          }`}
        />
      </button>

      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: isOpen ? "500px" : "0px", opacity: isOpen ? 1 : 0 }}
      >
        <p className="text-muted text-sm leading-relaxed pb-5 px-1">{a}</p>
      </div>
    </div>
  );
}

export default function FaqAccordion() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <>
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pt-14 pb-10 text-center space-y-4">
        <span className="inline-block px-4 py-1 rounded-full bg-primary-light text-primary text-sm font-semibold border border-primary/20">
          Frequently asked questions
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-foreground">FAQ</h1>
        <p className="text-muted text-lg max-w-xl mx-auto">
          Everything you need to know about LoveConverts. Can&apos;t find an answer?{" "}
          <Link href="/about" className="text-primary hover:underline">
            Reach out
          </Link>
          .
        </p>
      </section>

      <section className="max-w-2xl mx-auto px-4 sm:px-6 pb-20">
        <div className="bg-card rounded-2xl border border-border shadow-sm px-6">
          {FAQS.map((faq, i) => (
            <AccordionItem
              key={i}
              q={faq.q}
              a={faq.a}
              isOpen={openIdx === i}
              onToggle={() => setOpenIdx(openIdx === i ? null : i)}
            />
          ))}
        </div>
      </section>
    </>
  );
}
