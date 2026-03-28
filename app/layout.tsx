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
    default: "LoveConverts — Free Image Converter",
    template: "%s | LoveConverts",
  },
  description:
    "Convert images between JPG, PNG, WEBP, AVIF, GIF, BMP, TIFF, ICO and more. Fast, free, server-side conversion — no files stored, no sign-up required.",
  keywords: ["image converter", "convert image", "jpg to png", "webp converter", "avif converter", "free image conversion"],
  openGraph: {
    title: "LoveConverts — Free Image Converter",
    description: "Convert images between 8+ formats. Free, fast, server-side.",
    type: "website",
  },
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
