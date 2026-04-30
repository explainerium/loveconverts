import type { Metadata } from "next";
import ToolSchemas from "@/app/components/ToolSchemas";

export const metadata: Metadata = {
  title: { absolute: "AI Text to Image Generator Free — No Signup | LoveConverts" },
  description:
    "Generate images from text descriptions using AI. Type what you want to see and download the result free. No signup required. Powered by FLUX AI.",
  alternates: { canonical: "https://loveconverts.com/tools/text-to-image" },
  openGraph: {
    title: "AI Text to Image Generator Free Online",
    description:
      "Generate images from text descriptions using AI. Type what you want and download free. No signup, powered by FLUX.",
    url: "https://loveconverts.com/tools/text-to-image",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ToolSchemas
        name="AI Text to Image"
        slug="text-to-image"
        description="Generate images from text descriptions using AI. Type what you want to see and download the result free."
      />
      {children}
    </>
  );
}
