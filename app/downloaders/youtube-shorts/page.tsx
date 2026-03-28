import DownloaderTemplate from "@/app/components/downloaders/DownloaderTemplate";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "YouTube Shorts Downloader — Personal Use | LoveConverts",
  description: "Download YouTube Shorts videos for free. Personal use only.",
  keywords: "YouTube Shorts downloader, download YouTube Shorts, Shorts video download",
  openGraph: { title: "YouTube Shorts Downloader | LoveConverts", description: "Download YouTube Shorts — personal use only.", images: ["/og-image.png"] },
};

const ICON = (
  <div className="w-16 h-16 rounded-2xl bg-[#FF0000] flex items-center justify-center">
    <svg viewBox="0 0 32 32" fill="none" className="w-9 h-9">
      <path d="M21 11l-3-3v2.5H12a3 3 0 0 0-3 3v6a3 3 0 0 0 3 3h9a3 3 0 0 0 3-3v-6a3 3 0 0 0-3-3h-1v-2.5zm-1 5v3.5l-5-2.5v-2.5l5 1.5z" fill="white"/>
    </svg>
  </div>
);

export default function YouTubeShortsPage() {
  return (
    <DownloaderTemplate
      config={{
        slug: "youtube-shorts",
        name: "YouTube Shorts",
        description: "Download YouTube Shorts videos — for personal, lawful use only.",
        accent: "#FF0000",
        icon: ICON,
        formats: ["MP4"],
        isYouTube: true,
        urlExamples: [
          "https://www.youtube.com/shorts/XXXXXXXXXXX",
          "https://youtu.be/XXXXXXXXXXX",
        ],
        howToSteps: [
          "Open the YouTube Short and tap the Share icon → Copy link.",
          "Paste the Shorts URL into the field above (after accepting the disclaimer) and click Get Download Link.",
          "Click Download MP4 to save the Short to your device.",
        ],
        relatedPlatforms: [
          { slug: "youtube", name: "YouTube" },
          { slug: "tiktok", name: "TikTok" },
          { slug: "instagram", name: "Instagram" },
          { slug: "vimeo", name: "Vimeo" },
        ],
      }}
    />
  );
}
