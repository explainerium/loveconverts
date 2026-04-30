import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "AI Photo Enhancer — Upscale, Denoise & Sharpen Free | LoveConverts" },
  description:
    "Enhance photos with AI for free. Upscale 2x or 4x, remove noise, sharpen details, and improve portrait photos. No signup required.",
  alternates: { canonical: "https://loveconverts.com/tools/enhance" },
  openGraph: {
    title: "AI Photo Enhancer — Upscale, Denoise & Sharpen Free",
    description:
      "Enhance photos with AI for free. Upscale 2x or 4x, denoise, sharpen, improve portraits. No signup.",
    url: "https://loveconverts.com/tools/enhance",
  },
};

import ToolSchemas from "@/app/components/ToolSchemas";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ToolSchemas
        name="AI Photo Enhancer"
        slug="enhance"
        description="Enhance photos with AI for free. Upscale 2x or 4x, remove noise, sharpen details, and improve portrait photos."
      />
      {children}
    </>
  );
}
