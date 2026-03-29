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
    default: "LoveConverts — Free Image Converter & Downloader",
    template: "%s | LoveConverts",
  },
  description:
    "Free online image converter, compressor, resizer and social media downloader. Convert JPG, PNG, WEBP, AVIF. Download videos from TikTok, Instagram, YouTube. No signup required.",
  keywords: [
    "image converter", "compress image", "resize image", "webp converter", "free image tools",
    "tiktok downloader", "instagram downloader", "youtube downloader", "facebook video downloader",
    "free media converter", "online converter", "loveconverts",
  ],
  metadataBase: new URL("https://loveconverts.com"),
  openGraph: {
    title: "LoveConverts — Free Image Converter & Downloader",
    description: "Convert images & download videos from 10+ platforms. 100% free, fast, no sign-up.",
    type: "website",
    siteName: "LoveConverts",
    url: "https://loveconverts.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "LoveConverts — Free Image Converter & Downloader",
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
