import type { Metadata } from "next";
import ImageConverter from "./components/ImageConverter";

export const metadata: Metadata = {
  title: "LoveConverts — Free Image Converter",
  description:
    "Convert images between JPG, PNG, WEBP, AVIF, GIF, TIFF, ICO and more. Free, fast, server-side — no files stored, no sign-up required.",
  openGraph: {
    title: "LoveConverts — Free Image Converter",
    description:
      "Convert images between 8+ formats instantly. 100% free, no sign-up, server-side processing.",
  },
};

export default function Page() {
  return <ImageConverter />;
}
