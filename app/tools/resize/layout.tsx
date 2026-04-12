import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Resize Image Online Free: Change Image Dimensions",
  description: "Resize images for Instagram, Facebook, YouTube, LinkedIn and more. Free online image resizer with social media presets. No signup needed.",
  alternates: { canonical: "https://loveconverts.com/tools/resize" },
  openGraph: { url: "https://loveconverts.com/tools/resize" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
