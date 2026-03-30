import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Free Online Photo Editor: Adjust Brightness Contrast Filters",
  description: "Edit photos online free. Adjust brightness, contrast, saturation, sharpness and apply filters. No download needed, works in browser.",
  alternates: { canonical: "https://loveconverts.com/tools/photo-editor" },
  openGraph: { url: "https://loveconverts.com/tools/photo-editor" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
