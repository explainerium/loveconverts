import type { Metadata } from "next";
import ToolSchemas from "@/app/components/ToolSchemas";

export const metadata: Metadata = {
  title: "Add Text to Image Free Online - Batch, No Signup | LoveConverts",
  description:
    "Add text to images free online. No signup, no watermark. Supports batch mode - add the same text to multiple images at once and download as ZIP. 1000+ fonts, shadows, outlines, position presets.",
  alternates: { canonical: "https://loveconverts.com/tools/add-text" },
  openGraph: {
    title: "Add Text to Image Free Online - Batch, No Signup",
    description:
      "Add text to images free online. No signup, no watermark. Batch mode, 50+ fonts, shadows, outlines.",
    url: "https://loveconverts.com/tools/add-text",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ToolSchemas
        name="Add Text to Image"
        slug="add-text"
        description="Add text to images free online. No signup, no watermark."
      />
      {children}
    </>
  );
}
