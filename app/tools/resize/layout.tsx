import type { Metadata } from "next";
import ToolSchemas from "@/app/components/ToolSchemas";

export const metadata: Metadata = {
  title: { absolute: "Image Size Changer — Resize & Crop Photos Free Online | LoveConverts" },
  description:
    "Change image size online for free. Resize photos to exact pixels, percentage, or social media presets. No signup. Works on iPhone, Android, Windows and Mac.",
  alternates: { canonical: "https://loveconverts.com/tools/resize" },
  openGraph: {
    title: "Image Size Changer — Resize & Crop Photos Free Online",
    description:
      "Change image size online for free. Resize to exact pixels or social media presets. No signup.",
    url: "https://loveconverts.com/tools/resize",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ToolSchemas
        name="Image Size Changer"
        slug="resize"
        description="Change image size online for free. Resize photos to exact pixels, percentage, or social media presets."
      />
      {children}
    </>
  );
}
