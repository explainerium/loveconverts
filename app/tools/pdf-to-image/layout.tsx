import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Convert PDF to Image Free Online",
  description:
    "Extract PDF pages as JPG or PNG images. Select specific pages or convert all. Free, no signup required.",
  alternates: { canonical: "https://loveconverts.com/tools/pdf-to-image" },
  openGraph: { url: "https://loveconverts.com/tools/pdf-to-image" },
};
export default function PdfToImageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
