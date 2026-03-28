import DownloaderTemplate from "@/app/components/downloaders/DownloaderTemplate";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TikTok Video Downloader — No Watermark | LoveConverts",
  description: "Download TikTok videos without watermark. Free, fast, and no signup required.",
  keywords: "TikTok downloader, TikTok video download, TikTok no watermark",
  openGraph: { title: "TikTok Video Downloader | LoveConverts", description: "Save TikTok videos without watermark.", images: ["/og-image.png"] },
};

const ICON = (
  <div className="w-16 h-16 rounded-2xl bg-[#010101] flex items-center justify-center">
    <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
      <path d="M32 16.5c1.8 1.2 4 2 6.3 2v-4.5c-.4 0-.9-.1-1.3-.2v3.6c-2.3 0-4.5-.8-6.3-2v9.2c0 4.6-3.7 8.3-8.3 8.3-1.7 0-3.3-.5-4.6-1.4 1.5 1.5 3.5 2.5 5.8 2.5 4.6 0 8.3-3.7 8.3-8.3v-9.2zm1.6-4.5c-.9-1-1.5-2.3-1.6-3.8v-.6h-1.2c.3 1.8 1.4 3.3 2.8 4.4zM19.5 30.7c-.5-.7-.8-1.5-.8-2.3 0-2.2 1.8-3.9 3.9-3.9.4 0 .8.1 1.2.2v-4.6c-.4-.1-.8-.1-1.2-.1-4.6 0-8.3 3.7-8.3 8.3 0 2.9 1.5 5.5 3.7 7 .7-1.4 1.1-3 1.5-4.6z" fill="#EE1D52"/>
      <path d="M30.7 15.4c1.8 1.2 4 2 6.3 2V14c-1.3-.3-2.4-1-3.3-1.9-.7 1-1.8 2.1-3 3.3zm-8 13.5c0-2.2 1.8-3.9 3.9-3.9.4 0 .8.1 1.2.2V20.6c-4.5.1-8.2 3.8-8.2 8.3 0 2.9 1.5 5.4 3.7 6.9.5-1.3.9-2.8 1.5-4.3-.4-.6-.7-1.4-.7-2.2h-.4z" fill="#EE1D52"/>
      <path d="M37 14v-.6c-1.2 0-2.3-.3-3.3-1 .9 1 2 1.6 3.3 1.6zm-6.7 1.4c-.1-.5-.2-1-.2-1.5V7.4h-4.4v17.8c0 2.2-1.7 3.9-3.9 3.9-.6 0-1.2-.1-1.7-.4-.5 1.5-1 3-1.5 4.3 1.3.8 2.9 1.3 4.5 1.3 4.6 0 8.3-3.7 8.3-8.3v-9.2c.6 1.4 2.8 1.9 5 2.2v-3.6c-3-.3-5.8-1.6-6.1-4z" fill="#69C9D0"/>
    </svg>
  </div>
);

export default function TikTokPage() {
  return (
    <DownloaderTemplate
      config={{
        slug: "tiktok",
        name: "TikTok",
        description: "Save TikTok videos without watermark, in HD quality.",
        accent: "#010101",
        icon: ICON,
        formats: ["MP4"],
        urlExamples: [
          "https://www.tiktok.com/@username/video/1234567890",
          "https://vm.tiktok.com/XXXXXX/",
          "https://m.tiktok.com/v/1234567890.html",
        ],
        howToSteps: [
          "Open TikTok and find the video you want to save. Tap Share → Copy Link.",
          "Paste the TikTok URL into the input field above and click Get Download Link.",
          "Click the Download MP4 button to save the video without watermark to your device.",
        ],
        relatedPlatforms: [
          { slug: "instagram", name: "Instagram" },
          { slug: "youtube", name: "YouTube" },
          { slug: "facebook", name: "Facebook" },
          { slug: "twitter", name: "Twitter / X" },
        ],
      }}
    />
  );
}
