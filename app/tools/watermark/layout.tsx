import type { Metadata } from "next";
import ToolSchemas from "@/app/components/ToolSchemas";
export const metadata: Metadata = {
  title: "Add Watermark to Image Free Online",
  description: "Add text or image watermarks to your photos. Choose position, opacity, size, and color. Free, no signup required.",
  alternates: { canonical: "https://loveconverts.com/tools/watermark" },
  openGraph: { url: "https://loveconverts.com/tools/watermark" },
};
export default function WatermarkLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ToolSchemas
        name="Watermark Tool"
        slug="watermark"
        description="Add text or image watermarks to your photos. Choose position, opacity, size, and color."
      />
      {children}
    </>
  );
}
