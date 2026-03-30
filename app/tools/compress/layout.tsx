import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Compress Images Online Free: Reduce File Size",
  description: "Compress JPG, PNG, WEBP and AVIF images online without losing quality. Reduce file size by up to 80%. Free, no signup, files never stored.",
  alternates: { canonical: "https://loveconverts.com/tools/compress" },
  openGraph: { url: "https://loveconverts.com/tools/compress" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
