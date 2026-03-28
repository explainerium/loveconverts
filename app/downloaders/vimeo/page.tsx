import DownloaderTemplate from "@/app/components/downloaders/DownloaderTemplate";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vimeo Video Downloader — HD Free | LoveConverts",
  description: "Download Vimeo videos in HD quality for free. No signup required.",
  keywords: "Vimeo downloader, Vimeo video download, download Vimeo HD",
  openGraph: { title: "Vimeo Video Downloader | LoveConverts", description: "Download Vimeo videos in HD.", images: ["/og-image.png"] },
};

const ICON = (
  <div className="w-16 h-16 rounded-2xl bg-[#1AB7EA] flex items-center justify-center">
    <svg viewBox="0 0 32 32" fill="none" className="w-9 h-9">
      <path d="M26.6 10.1c-.1 2.7-2 6.5-5.7 11.2C17.4 26.4 14 29 11.2 29c-1.6 0-2.9-1.4-3.9-4.2l-2.1-7.8C4.4 14.7 3.5 13.3 2.6 13.3c-.2 0-.9.4-2 1.1l-1-.9c1.2-1.1 2.4-2.1 3.6-3.3 1.6-1.4 2.8-2.1 3.6-2.2 1.9-.2 3.1 1.1 3.5 3.9.5 3 .8 4.9 1 5.6.5 2.5 1.1 3.7 1.9 3.7.5 0 1.3-.3 2.3-1.1 1-.7 2.3-2.4 3.2-4.1.3-.7.5-1.3.5-1.7 0-1.1-.7-1.7-2-1.7-.4 0-.9.1-1.3.3.9-2.9 2.6-4.3 5.2-4.3 1.9.1 2.8 1.2 2.5 3.6z" fill="white"/>
    </svg>
  </div>
);

export default function VimeoPage() {
  return (
    <DownloaderTemplate
      config={{
        slug: "vimeo",
        name: "Vimeo",
        description: "Download Vimeo videos in HD quality, directly to your device.",
        accent: "#1AB7EA",
        icon: ICON,
        formats: ["MP4"],
        urlExamples: [
          "https://vimeo.com/123456789",
          "https://player.vimeo.com/video/123456789",
          "https://vimeo.com/channels/XXXXXXXXXX/123456789",
        ],
        howToSteps: [
          "Open the Vimeo video you want to save and copy the URL from your browser's address bar.",
          "Paste the Vimeo URL into the input field above and click Get Download Link.",
          "Select your preferred quality and click Download MP4 to save the video.",
        ],
        relatedPlatforms: [
          { slug: "youtube", name: "YouTube" },
          { slug: "dailymotion", name: "Dailymotion" },
          { slug: "facebook", name: "Facebook" },
          { slug: "soundcloud", name: "SoundCloud" },
        ],
      }}
    />
  );
}
