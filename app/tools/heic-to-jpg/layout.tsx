import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Convert HEIC to JPG Free Online - iPhone Photos Made Compatible",
  description:
    "Convert iPhone HEIC photos to JPG instantly. Free, no signup, no software needed. Works on any device. Upload HEIC files and download JPG.",
  alternates: { canonical: "https://loveconverts.com/tools/heic-to-jpg" },
  openGraph: {
    title: "Convert HEIC to JPG Free Online - iPhone Photos Made Compatible",
    description:
      "Convert iPhone HEIC photos to JPG instantly. Free, no signup, no software needed.",
    url: "https://loveconverts.com/tools/heic-to-jpg",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
