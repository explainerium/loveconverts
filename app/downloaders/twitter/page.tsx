import DownloaderTemplate from "@/app/components/downloaders/DownloaderTemplate";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Twitter / X Video Downloader — Save Tweets as MP4",
  description: "Download videos and GIFs from Twitter and X online. Paste any tweet link and save as MP4 or GIF. Free, no signup needed.",
  keywords: "Twitter video downloader, X video download, download tweet video, Twitter GIF download",
  alternates: { canonical: "https://loveconverts.com/downloaders/twitter" },
  openGraph: { url: "https://loveconverts.com/downloaders/twitter", title: "Twitter / X Video Downloader | LoveConverts", description: "Save videos and GIFs from tweets.", images: ["/og-image.png"] },
};

const ICON = (
  <div className="w-16 h-16 rounded-2xl bg-black flex items-center justify-center">
    <svg viewBox="0 0 32 32" fill="none" className="w-8 h-8">
      <path d="M18.2 14.3L25.3 6h-1.7L17.4 13 12 6H6l7.4 10.8L6 26h1.7l6.5-7.5 5.2 7.5H26L18.2 14.3zm-2.3 2.6l-.8-1.1L8 7.2h2.5l5.3 7.6.8 1.1 6.6 9.4H20.7l-4.8-6.4z" fill="white"/>
    </svg>
  </div>
);

export default function TwitterPage() {
  return (
    <DownloaderTemplate
      config={{
        slug: "twitter",
        name: "Twitter / X",
        description: "Download videos and GIFs from tweets on Twitter (X) for free.",
        accent: "#000000",
        icon: ICON,
        formats: ["MP4", "GIF"],
        urlExamples: [
          "https://twitter.com/username/status/1234567890",
          "https://x.com/username/status/1234567890",
          "https://t.co/XXXXXXXXXX",
        ],
        howToSteps: [
          "Find the tweet with the video or GIF. Click the share icon → Copy link to tweet.",
          "Paste the tweet URL into the input above, choose MP4 or GIF format, then click Get Download Link.",
          "Click the Download button to save the video or GIF to your device.",
        ],
        relatedPlatforms: [
          { slug: "tiktok", name: "TikTok" },
          { slug: "instagram", name: "Instagram" },
          { slug: "facebook", name: "Facebook" },
          { slug: "youtube", name: "YouTube" },
        ],
      }}
    />
  );
}
