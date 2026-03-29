import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Resize Image Online Free — Change Image Dimensions",
  description: "Resize images online to any dimension. Presets for Instagram, Twitter, Facebook, icons and more. Free, fast, no signup required.",
  alternates: { canonical: "https://loveconverts.com/tools/resize" },
  openGraph: { url: "https://loveconverts.com/tools/resize" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
