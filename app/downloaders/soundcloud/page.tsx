import DownloaderTemplate from "@/app/components/downloaders/DownloaderTemplate";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SoundCloud Downloader: Save SoundCloud Tracks Free",
  description: "Download SoundCloud tracks online for free. Paste any SoundCloud URL and save as MP3. For personal use only.",
  keywords: "SoundCloud downloader, SoundCloud MP3 download, download SoundCloud tracks",
  alternates: { canonical: "https://loveconverts.com/downloaders/soundcloud" },
  openGraph: { url: "https://loveconverts.com/downloaders/soundcloud", title: "SoundCloud Downloader | LoveConverts", description: "Save SoundCloud tracks as MP3.", images: ["/og-image.png"] },
};

const ICON = (
  <div className="w-16 h-16 rounded-2xl bg-[#FF5500] flex items-center justify-center">
    <svg viewBox="0 0 32 32" fill="none" className="w-9 h-9">
      <path d="M4 18a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm3.5-2c0-.8-.3-1.5-.6-1.9-.1-.1-.1-.2-.1-.4 0-.4.4-.7.8-.7.2 0 .3.1.4.1C8.8 13.8 9.2 15 9.2 16v3H7.5v-3zm3-1.5c0-2.2 1.5-4.1 3.3-4.5.2 0 .4.1.4.4v8.6H10.5V14.5zm4 4V9.5c0-.2.1-.4.4-.4 1 .1 2.2 1.6 2.2 3.8v6.6h-2.6zm5 0v-4.1c0-.4.3-.7.7-.8 1.5-.4 2.8.5 3.3 1.7.5-.9 1.4-1.5 2.5-1.5 1.8 0 3.3 1.5 3.3 3.3 0 .8-.3 1.5-.7 1.5H20v-.1zm0 0" fill="white"/>
    </svg>
  </div>
);

export default function SoundCloudPage() {
  return (
    <DownloaderTemplate
      config={{
        slug: "soundcloud",
        name: "SoundCloud",
        description: "Download SoundCloud tracks and playlists as high-quality MP3 files.",
        accent: "#FF5500",
        icon: ICON,
        formats: ["MP3"],
        supportsAudio: true,
        urlExamples: [
          "https://soundcloud.com/artist/track-name",
          "https://soundcloud.com/artist/sets/playlist-name",
          "https://on.soundcloud.com/XXXXXXXXXX",
        ],
        howToSteps: [
          "Open SoundCloud and find the track or playlist you want to download. Click Share → Copy Link.",
          "Paste the SoundCloud URL into the field above and click Get Download Link.",
          "Click Download MP3 to save the audio track to your device.",
        ],
        relatedPlatforms: [
          { slug: "vimeo", name: "Vimeo" },
          { slug: "youtube", name: "YouTube" },
          { slug: "dailymotion", name: "Dailymotion" },
          { slug: "facebook", name: "Facebook" },
        ],
      }}
    />
  );
}
