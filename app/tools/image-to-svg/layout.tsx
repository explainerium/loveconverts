import type { Metadata } from "next";
import ToolSchemas from "@/app/components/ToolSchemas";

export const metadata: Metadata = {
  title: "Convert Image to SVG Free Online — Vectorize Any Image",
  description:
    "Convert JPG, PNG, WebP and other images to SVG vector format for free. Black & white or color tracing. No signup required. Files never stored.",
  alternates: { canonical: "https://loveconverts.com/tools/image-to-svg" },
  openGraph: {
    title: "Convert Image to SVG Free — Vectorize Any Image",
    description:
      "Convert raster images to scalable SVG vector graphics. Free, instant, no signup.",
    url: "https://loveconverts.com/tools/image-to-svg",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ToolSchemas
        name="Image to SVG"
        slug="image-to-svg"
        description="Convert JPG, PNG, WebP and other images to SVG vector format for free."
      />
      {children}
    </>
  );
}
