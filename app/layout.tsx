import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
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
  preload: false,
});

export const metadata: Metadata = {
  title: {
    default: "Free Image Converter & Video Downloader | LoveConverts",
    template: "%s | LoveConverts",
  },
  description:
    "Convert, compress, resize and crop images free. Download videos from TikTok, Instagram, YouTube and Facebook. No signup. Files never stored.",
  keywords: [
    "image converter", "compress image", "resize image", "webp converter", "free image tools",
    "compress video", "video compressor", "compress mp4", "shrink video",
    "tiktok downloader", "instagram downloader", "youtube downloader", "facebook video downloader",
    "free media converter", "online converter", "loveconverts",
  ],
  metadataBase: new URL("https://loveconverts.com"),
  openGraph: {
    type: "website",
    siteName: "LoveConverts",
    title: "Free Image Converter & Video Downloader | LoveConverts",
    description:
      "Convert, compress, resize and crop images free. Download videos from TikTok, Instagram, YouTube and Facebook. No signup. Files never stored.",
    url: "https://loveconverts.com",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "LoveConverts — Free Image Converter & Video Downloader",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Image Converter & Video Downloader | LoveConverts",
    description:
      "Convert, compress, resize and crop images free. Download from TikTok, Instagram, YouTube and Facebook. No signup.",
    images: ["/og-image.png"],
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
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', {
                  page_path: window.location.pathname,
                });
              `}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
