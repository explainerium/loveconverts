import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Convert Image to JPG Free Online",
  description: "Convert PNG, WEBP, AVIF, GIF and BMP images to JPG online for free. Adjust quality, batch convert multiple files at once.",
  alternates: { canonical: "https://loveconverts.com/tools/convert-to-jpg" },
  openGraph: { url: "https://loveconverts.com/tools/convert-to-jpg" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
