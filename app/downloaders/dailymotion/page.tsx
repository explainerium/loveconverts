import DownloaderTemplate from "@/app/components/downloaders/DownloaderTemplate";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dailymotion Video Downloader — Free | LoveConverts",
  description: "Download Dailymotion videos in HD quality for free. Fast and easy.",
  keywords: "Dailymotion downloader, Dailymotion video download, save Dailymotion video",
  openGraph: { title: "Dailymotion Video Downloader | LoveConverts", description: "Download Dailymotion videos for free.", images: ["/og-image.png"] },
};

const ICON = (
  <div className="w-16 h-16 rounded-2xl bg-[#003F8A] flex items-center justify-center">
    <svg viewBox="0 0 32 32" fill="none" className="w-9 h-9">
      <circle cx="14" cy="18" r="6" fill="#0091CE"/>
      <path d="M23 8V18c0 5-4 9-9 9S5 23 5 18s4-9 9-9c1.7 0 3.3.5 4.5 1.3V6H23v2zm-9 16c3.3 0 6-2.7 6-6s-2.7-6-6-6-6 2.7-6 6 2.7 6 6 6z" fill="white"/>
    </svg>
  </div>
);

export default function DailymotionPage() {
  return (
    <DownloaderTemplate
      config={{
        slug: "dailymotion",
        name: "Dailymotion",
        description: "Download Dailymotion videos in HD quality, directly to your device for free.",
        accent: "#003F8A",
        icon: ICON,
        formats: ["MP4"],
        urlExamples: [
          "https://www.dailymotion.com/video/XXXXXXXXXX",
          "https://dai.ly/XXXXXXXXXX",
          "https://www.dailymotion.com/video/XXXXXXXXXX_title",
        ],
        howToSteps: [
          "Open the Dailymotion video you want to download and copy the URL from the browser.",
          "Paste the Dailymotion URL into the input above and click Get Download Link.",
          "Click Download MP4 to save the video to your device.",
        ],
        relatedPlatforms: [
          { slug: "vimeo", name: "Vimeo" },
          { slug: "youtube", name: "YouTube" },
          { slug: "facebook", name: "Facebook" },
          { slug: "soundcloud", name: "SoundCloud" },
        ],
      }}
    />
  );
}
