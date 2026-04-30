import type { Metadata } from "next";
import ToolSchemas from "@/app/components/ToolSchemas";
export const metadata: Metadata = {
  title: "Convert Images to PDF Free Online",
  description: "Combine multiple images into a single PDF document. Support for JPG, PNG, WEBP. Choose page size, orientation, and margins. Free, no signup.",
  alternates: { canonical: "https://loveconverts.com/tools/image-to-pdf" },
  openGraph: { url: "https://loveconverts.com/tools/image-to-pdf" },
};
export default function ImageToPdfLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ToolSchemas
        name="Image to PDF"
        slug="image-to-pdf"
        description="Combine multiple images into a single PDF document."
      />
      {children}
    </>
  );
}
