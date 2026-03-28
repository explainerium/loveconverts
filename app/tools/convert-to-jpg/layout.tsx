import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Convert to JPG Online — Free",
  description: "Convert PNG, WEBP, AVIF, GIF, BMP, TIFF to JPG. Free online JPG converter with quality control.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
