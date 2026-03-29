import type { Metadata } from "next";
import FaqAccordion from "./FaqAccordion";
import JsonLd from "../components/JsonLd";

export const metadata: Metadata = {
  title: "FAQ — Frequently Asked Questions",
  description:
    "Answers to common questions about LoveConverts image tools and video downloaders. File size limits, supported formats, privacy and more.",
  alternates: { canonical: "https://loveconverts.com/faq" },
};

export default function FaqPage() {
  return (
    <div className="bg-background">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            {
              "@type": "Question",
              name: "Is LoveConverts really free?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Yes, all core tools on LoveConverts are completely free to use with no signup required.",
              },
            },
            {
              "@type": "Question",
              name: "Are my files stored on the server?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "No. All files are processed in memory and never written to disk. Your files are deleted immediately after conversion.",
              },
            },
            {
              "@type": "Question",
              name: "What is the maximum file size?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Free users can upload files up to 10MB. Pro users can upload files up to 50MB.",
              },
            },
            {
              "@type": "Question",
              name: "What image formats are supported?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "LoveConverts supports JPG, JPEG, PNG, WEBP, AVIF, GIF, BMP, TIFF, and ICO formats.",
              },
            },
            {
              "@type": "Question",
              name: "Is it legal to download social media videos?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "You should only download content you own or have explicit permission to download. Downloading copyrighted content without permission may violate platform Terms of Service.",
              },
            },
          ],
        }}
      />
      <FaqAccordion />
    </div>
  );
}
