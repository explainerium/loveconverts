import DownloaderTemplate from "@/app/components/downloaders/DownloaderTemplate";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pinterest Video Downloader — Save Pinterest Videos",
  description: "Download Pinterest videos and images online for free. Paste any Pinterest pin link and save as MP4 or JPG.",
  keywords: "Pinterest downloader, Pinterest video download, Pinterest image download",
  alternates: { canonical: "https://loveconverts.com/downloaders/pinterest" },
  openGraph: { url: "https://loveconverts.com/downloaders/pinterest", title: "Pinterest Downloader | LoveConverts", description: "Save Pinterest videos and images.", images: ["/og-image.png"] },
};

const ICON = (
  <div className="w-16 h-16 rounded-2xl bg-[#E60023] flex items-center justify-center">
    <svg viewBox="0 0 32 32" fill="none" className="w-9 h-9">
      <path d="M16 3C8.8 3 3 8.8 3 16c0 5.5 3.3 10.2 8.1 12.3-.1-1-.1-2.6.3-3.7.3-1.1 2-8.4 2-8.4s-.5-1-.5-2.6c0-2.4 1.4-4.2 3.1-4.2 1.5 0 2.2 1.1 2.2 2.5 0 1.5-1 3.8-1.5 5.9-.4 1.8.9 3.2 2.6 3.2 3.1 0 5.5-3.3 5.5-8 0-4.2-3-7.1-7.3-7.1-5 0-7.9 3.7-7.9 7.5 0 1.5.6 3.1 1.3 3.9.1.2.1.3.1.5-.1.5-.4 1.8-.4 2 0 .3-.1.4-.4.2-1.5-.7-2.4-2.9-2.4-4.6 0-3.8 2.8-7.3 8-7.3 4.2 0 7.5 3 7.5 7 0 4.2-2.6 7.5-6.3 7.5-1.2 0-2.4-.6-2.8-1.4 0 0-.6 2.4-.8 2.9-.3 1-.9 2-1.4 2.8.9.3 1.8.5 2.8.5 7.2 0 13-5.8 13-13S23.2 3 16 3z" fill="white"/>
    </svg>
  </div>
);

export default function PinterestPage() {
  return (
    <DownloaderTemplate
      config={{
        slug: "pinterest",
        name: "Pinterest",
        description: "Download Pinterest videos, animated pins, and images directly to your device.",
        accent: "#E60023",
        icon: ICON,
        formats: ["MP4", "JPG"],
        urlExamples: [
          "https://www.pinterest.com/pin/1234567890/",
          "https://pin.it/XXXXXXXXXX",
          "https://pinterest.com/pin/XXXXXXXXXX",
        ],
        howToSteps: [
          "Find the Pinterest pin you want to save. Click the share icon and copy the pin link.",
          "Paste the Pinterest URL above, select MP4 for video or JPG for images, and click Get Download Link.",
          "Click Download to save the content to your device.",
        ],
        relatedPlatforms: [
          { slug: "instagram", name: "Instagram" },
          { slug: "tiktok", name: "TikTok" },
          { slug: "facebook", name: "Facebook" },
          { slug: "twitter", name: "Twitter / X" },
        ],
      }}
    />
  );
}
