import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Providers from "./components/Providers";
import ToolsNav from "./components/ToolsNav";
import FloatingSupport from "./components/FloatingSupport";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: false, // Skip preload to avoid network fetch at build time
});

export const metadata: Metadata = {
  title: {
    default: "LoveConverts — Free Media Converter & Downloader",
    template: "%s | LoveConverts",
  },
  description:
    "Convert images between JPG, PNG, WEBP, AVIF, GIF, BMP, TIFF, ICO and more. Download videos from YouTube, Instagram, Facebook, TikTok & 10+ platforms. 100% free, fast, no sign-up required.",
  keywords: [
    "image converter", "convert image", "jpg to png", "webp converter", "avif converter", "free image conversion",
    "video downloader", "youtube downloader", "instagram downloader", "facebook video downloader", "tiktok downloader",
    "free media converter", "online converter", "loveconverts",
  ],
  metadataBase: new URL("https://loveconverts.com"),
  openGraph: {
    title: "LoveConverts — Free Media Converter & Downloader",
    description: "Convert images & download videos from 10+ platforms. 100% free, fast, no sign-up.",
    type: "website",
    siteName: "LoveConverts",
    url: "https://loveconverts.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "LoveConverts — Free Media Converter & Downloader",
    description: "Convert images & download videos from 10+ platforms. 100% free, fast, no sign-up.",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-background text-foreground antialiased">
        <Providers>
          <Header />
          <ToolsNav />
          <main className="flex-1">{children}</main>
          <Footer />
          <FloatingSupport />
        </Providers>
      </body>
    </html>
  );
}
