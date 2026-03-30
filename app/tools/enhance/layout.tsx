import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Photo Enhancer: Free Online Image Enhancement",
  description: "Enhance photos with AI-powered tools. Magic Fix, Super Zoom, effects and filters. 100% free, no signup required.",
  alternates: { canonical: "https://loveconverts.com/tools/enhance" },
  openGraph: { url: "https://loveconverts.com/tools/enhance" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
