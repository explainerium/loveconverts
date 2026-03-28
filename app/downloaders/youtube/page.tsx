import DownloaderTemplate from "@/app/components/downloaders/DownloaderTemplate";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "YouTube Video Downloader — Personal Use Only | LoveConverts",
  description: "Download YouTube videos for personal use. HD quality, free, fast.",
  keywords: "YouTube downloader, YouTube video download, save YouTube video",
  openGraph: { title: "YouTube Video Downloader | LoveConverts", description: "Download YouTube videos — personal use only.", images: ["/og-image.png"] },
};

const ICON = (
  <div className="w-16 h-16 rounded-2xl bg-[#FF0000] flex items-center justify-center">
    <svg viewBox="0 0 32 32" fill="none" className="w-9 h-9">
      <path d="M27 11s-.3-2-1.2-2.8c-1.1-1.2-2.3-1.2-2.9-1.3C19.6 6.7 16 6.7 16 6.7s-3.6 0-6.9.2c-.6.1-1.8.1-2.9 1.3C5.3 9 5 11 5 11S4.7 13.2 4.7 15.5v2.2c0 2.2.3 4.5.3 4.5s.3 2 1.2 2.8c1.1 1.2 2.6 1.1 3.3 1.2C11.6 26.5 16 26.5 16 26.5s3.6 0 6.9-.3c.6-.1 1.8-.1 2.9-1.3C26.7 24 27 22 27 22s.3-2.3.3-4.5v-2.2C27.3 13.2 27 11 27 11z" fill="#FF0000"/>
      <path d="M13.5 19.5v-7l7 3.5-7 3.5z" fill="white"/>
    </svg>
  </div>
);

export default function YouTubePage() {
  return (
    <DownloaderTemplate
      config={{
        slug: "youtube",
        name: "YouTube",
        description: "Download YouTube videos — for personal, lawful use only.",
        accent: "#FF0000",
        icon: ICON,
        formats: ["MP4"],
        isYouTube: true,
        urlExamples: [
          "https://www.youtube.com/watch?v=XXXXXXXXXXX",
          "https://youtu.be/XXXXXXXXXXX",
          "https://www.youtube.com/shorts/XXXXXXXXXXX",
        ],
        howToSteps: [
          "Copy the YouTube video URL from your browser address bar or click Share → Copy Link.",
          "Paste the URL above (after accepting the disclaimer), choose quality, then click Get Download Link.",
          "Click Download MP4 to save the video directly to your device.",
        ],
        relatedPlatforms: [
          { slug: "youtube-shorts", name: "YouTube Shorts" },
          { slug: "vimeo", name: "Vimeo" },
          { slug: "dailymotion", name: "Dailymotion" },
          { slug: "facebook", name: "Facebook" },
        ],
      }}
    />
  );
}
