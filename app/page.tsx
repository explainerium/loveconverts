import type { Metadata } from "next";
import ImageConverter from "./components/ImageConverter";

export const metadata: Metadata = {
  title: "LoveConverts — Free Media Converter & Downloader",
  description:
    "Convert images between JPG, PNG, WEBP, AVIF, GIF, TIFF, ICO and more. Download videos from YouTube, Instagram, Facebook, TikTok & 10+ platforms. Free, fast — no files stored, no sign-up required.",
  openGraph: {
    title: "LoveConverts — Free Media Converter & Downloader",
    description:
      "Convert images & download videos from 10+ platforms instantly. 100% free, no sign-up.",
  },
};

export default function Page() {
  return <ImageConverter />;
}
