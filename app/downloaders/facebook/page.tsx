import DownloaderTemplate from "@/app/components/downloaders/DownloaderTemplate";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Facebook Video Downloader — Free & Fast | LoveConverts",
  description: "Download Facebook videos and Reels in HD. Free, fast, no signup needed.",
  keywords: "Facebook video downloader, Facebook Reels download, download Facebook video",
  openGraph: { title: "Facebook Video Downloader | LoveConverts", description: "Save Facebook videos and Reels.", images: ["/og-image.png"] },
};

const ICON = (
  <div className="w-16 h-16 rounded-2xl bg-[#1877F2] flex items-center justify-center">
    <svg viewBox="0 0 32 32" fill="none" className="w-9 h-9">
      <path d="M19 18h3.5l1-4.5H19v-2c0-1.2.5-2.5 2-2.5h2.5V5.5S21.5 5 20 5c-3.7 0-6 2.2-6 6.2V13.5h-3.5V18H14V30h5V18z" fill="white"/>
    </svg>
  </div>
);

export default function FacebookPage() {
  return (
    <DownloaderTemplate
      config={{
        slug: "facebook",
        name: "Facebook",
        description: "Download Facebook videos and Reels in HD quality, directly to your device.",
        accent: "#1877F2",
        icon: ICON,
        formats: ["MP4"],
        urlExamples: [
          "https://www.facebook.com/video/1234567890",
          "https://www.facebook.com/watch/?v=1234567890",
          "https://fb.watch/XXXXXXXXXX/",
          "https://www.facebook.com/reel/XXXXXXXXXX",
        ],
        howToSteps: [
          "Find the Facebook video you want to download. Click the three dots (⋯) → Copy link.",
          "Paste the Facebook video URL into the field above and click Get Download Link.",
          "Click Download MP4 to save the video to your device.",
        ],
        relatedPlatforms: [
          { slug: "instagram", name: "Instagram" },
          { slug: "tiktok", name: "TikTok" },
          { slug: "youtube", name: "YouTube" },
          { slug: "twitter", name: "Twitter / X" },
        ],
      }}
    />
  );
}
