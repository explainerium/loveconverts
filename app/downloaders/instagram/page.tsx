import DownloaderTemplate from "@/app/components/downloaders/DownloaderTemplate";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Instagram Video and Reels Downloader: Save IG Videos",
  description: "Download Instagram Reels, videos and photos online. Paste any Instagram link and save as MP4 or JPG. Free, no signup required.",
  keywords: "Instagram downloader, Instagram Reels download, Instagram video download",
  alternates: { canonical: "https://loveconverts.com/downloaders/instagram" },
  openGraph: { url: "https://loveconverts.com/downloaders/instagram", title: "Instagram Reels Downloader | LoveConverts", description: "Save Instagram Reels, videos, and photos.", images: ["/og-image.png"] },
};

const ICON = (
  <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#F58529,#DD2A7B,#8134AF)" }}>
    <svg viewBox="0 0 32 32" fill="none" className="w-9 h-9">
      <rect x="5" y="5" width="22" height="22" rx="6" stroke="white" strokeWidth="2.5"/>
      <circle cx="16" cy="16" r="5.5" stroke="white" strokeWidth="2.5"/>
      <circle cx="23" cy="9" r="1.5" fill="white"/>
    </svg>
  </div>
);

export default function InstagramPage() {
  return (
    <DownloaderTemplate
      config={{
        slug: "instagram",
        name: "Instagram",
        description: "Download Instagram Reels, videos, IGTV, and photos in original quality.",
        accent: "#E1306C",
        icon: ICON,
        formats: ["MP4", "JPG"],
        urlExamples: [
          "https://www.instagram.com/reel/XXXXXXXXXX/",
          "https://www.instagram.com/p/XXXXXXXXXX/",
          "https://www.instagram.com/tv/XXXXXXXXXX/",
        ],
        howToSteps: [
          "Open Instagram and find the Reel, video, or photo you want to download. Tap the three dots (⋯) → Copy Link.",
          "Paste the Instagram URL into the field above, choose MP4 for video or JPG for photos, then click Get Download Link.",
          "Click the Download button to save the content directly to your device.",
        ],
        relatedPlatforms: [
          { slug: "tiktok", name: "TikTok" },
          { slug: "facebook", name: "Facebook" },
          { slug: "pinterest", name: "Pinterest" },
          { slug: "twitter", name: "Twitter / X" },
        ],
      }}
    />
  );
}
