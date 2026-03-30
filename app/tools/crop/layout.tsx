import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Crop Image Online Free: Trim and Cut Images",
  description: "Crop images online with a drag-and-drop crop editor. Choose aspect ratios: 1:1, 4:3, 16:9 and more. Free, no signup needed.",
  alternates: { canonical: "https://loveconverts.com/tools/crop" },
  openGraph: { url: "https://loveconverts.com/tools/crop" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
