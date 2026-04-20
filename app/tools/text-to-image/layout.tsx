import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Text to Image Generator Free Online | LoveConverts",
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
  return children;
}
