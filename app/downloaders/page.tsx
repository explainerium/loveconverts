import Link from "next/link";
import type { Metadata } from "next";
import { AlertTriangle } from "lucide-react";

export const metadata: Metadata = {
  title: "Free Video & Social Media Downloaders | LoveConverts",
  description: "Download videos from TikTok, Instagram, YouTube, Facebook, Twitter, Pinterest, SoundCloud, Vimeo, and more — free and fast.",
  keywords: "video downloader, TikTok downloader, Instagram downloader, YouTube downloader, Facebook video downloader",
  openGraph: {
    title: "Free Video & Social Media Downloaders | LoveConverts",
    description: "Download from 10+ platforms — TikTok, Instagram, YouTube, and more.",
    images: ["/og-image.png"],
  },
};

const PLATFORMS = [
  {
    slug: "tiktok",
    name: "TikTok",
    accent: "#010101",
    bg: "#f0f0f0",
    desc: "Save TikTok videos without watermark",
    formats: ["MP4"],
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-8 h-8">
        <rect width="48" height="48" rx="12" fill="#010101"/>
        <path d="M32 16.5c1.8 1.2 4 2 6.3 2v-4.5c-.4 0-.9-.1-1.3-.2v3.6c-2.3 0-4.5-.8-6.3-2v9.2c0 4.6-3.7 8.3-8.3 8.3-1.7 0-3.3-.5-4.6-1.4 1.5 1.5 3.5 2.5 5.8 2.5 4.6 0 8.3-3.7 8.3-8.3v-9.2zm1.6-4.5c-.9-1-1.5-2.3-1.6-3.8v-.6h-1.2c.3 1.8 1.4 3.3 2.8 4.4zM19.5 30.7c-.5-.7-.8-1.5-.8-2.3 0-2.2 1.8-3.9 3.9-3.9.4 0 .8.1 1.2.2v-4.6c-.4-.1-.8-.1-1.2-.1-4.6 0-8.3 3.7-8.3 8.3 0 2.9 1.5 5.5 3.7 7 .7-1.4 1.1-3 1.5-4.6z" fill="white"/>
        <path d="M30.7 15.4c1.8 1.2 4 2 6.3 2V14c-1.3-.3-2.4-1-3.3-1.9-.7 1-1.8 2.1-3 3.3zm-8 13.5c0-2.2 1.8-3.9 3.9-3.9.4 0 .8.1 1.2.2V20.6c-4.5.1-8.2 3.8-8.2 8.3 0 2.9 1.5 5.4 3.7 6.9.5-1.3.9-2.8 1.5-4.3-.4-.6-.7-1.4-.7-2.2h-.4z" fill="#EE1D52"/>
        <path d="M37 14v-.6c-1.2 0-2.3-.3-3.3-1 .9 1 2 1.6 3.3 1.6zm-6.7 1.4c-.1-.5-.2-1-.2-1.5V7.4h-4.4v17.8c0 2.2-1.7 3.9-3.9 3.9-.6 0-1.2-.1-1.7-.4-.5 1.5-1 3-1.5 4.3 1.3.8 2.9 1.3 4.5 1.3 4.6 0 8.3-3.7 8.3-8.3v-9.2c.6 1.4 2.8 1.9 5 2.2v-3.6c-3-.3-5.8-1.6-6.1-4z" fill="#69C9D0"/>
      </svg>
    ),
  },
  {
    slug: "instagram",
    name: "Instagram",
    accent: "#E1306C",
    bg: "#fff0f5",
    desc: "Download Reels, photos and stories",
    formats: ["MP4", "JPG"],
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-8 h-8">
        <defs>
          <linearGradient id="ig" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#F58529"/>
            <stop offset="50%" stopColor="#DD2A7B"/>
            <stop offset="100%" stopColor="#8134AF"/>
          </linearGradient>
        </defs>
        <rect width="48" height="48" rx="12" fill="url(#ig)"/>
        <rect x="13" y="13" width="22" height="22" rx="6" stroke="white" strokeWidth="2.5" fill="none"/>
        <circle cx="24" cy="24" r="5.5" stroke="white" strokeWidth="2.5"/>
        <circle cx="34" cy="14" r="1.5" fill="white"/>
      </svg>
    ),
  },
  {
    slug: "facebook",
    name: "Facebook",
    accent: "#1877F2",
    bg: "#eff6ff",
    desc: "Download Facebook videos and reels",
    formats: ["MP4"],
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-8 h-8">
        <rect width="48" height="48" rx="12" fill="#1877F2"/>
        <path d="M27 26.5h3.5l1-4.5H27v-2c0-1.2.5-2.5 2-2.5h2.5V13.5S29.5 13 28 13c-3.7 0-6 2.2-6 6.2V22h-3.5v4.5H22V38h5V26.5z" fill="white"/>
      </svg>
    ),
  },
  {
    slug: "twitter",
    name: "Twitter / X",
    accent: "#000000",
    bg: "#f5f5f5",
    desc: "Save videos and GIFs from tweets",
    formats: ["MP4", "GIF"],
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-8 h-8">
        <rect width="48" height="48" rx="12" fill="#000"/>
        <path d="M26.9 21.7L34.8 13h-2l-6.9 7.9L20.3 13H13l8.3 12-8.3 9.9h2l7.3-8.4 5.8 8.4H34L26.9 21.7zm-2.6 3l-.8-1.2L16 14.2h2.9l5.5 7.8.8 1.2 7 9.8h-2.9l-5.8-8.1-.2.1z" fill="white"/>
      </svg>
    ),
  },
  {
    slug: "youtube",
    name: "YouTube",
    accent: "#FF0000",
    bg: "#fff5f5",
    desc: "Download YouTube videos — personal use only",
    formats: ["MP4"],
    warn: true,
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-8 h-8">
        <rect width="48" height="48" rx="12" fill="#FF0000"/>
        <path d="M39 19s-.4-2.7-1.7-3.9c-1.6-1.7-3.4-1.7-4.2-1.8C28.7 13 24 13 24 13s-4.7 0-9.1.3c-.8.1-2.6.1-4.2 1.8C9.4 16.3 9 19 9 19S8.6 22.2 8.6 25.4v3c0 3.2.4 6.4.4 6.4s.4 2.7 1.7 3.9c1.6 1.7 3.7 1.6 4.6 1.8C17.6 40.9 24 41 24 41s4.7 0 9.1-.4c.8-.1 2.6-.1 4.2-1.8 1.3-1.2 1.7-3.9 1.7-3.9s.4-3.2.4-6.4v-3C39.4 22.2 39 19 39 19z" fill="#FF0000"/>
        <path d="M21 28.5v-9l8 4.5-8 4.5z" fill="white"/>
      </svg>
    ),
  },
  {
    slug: "youtube-shorts",
    name: "YouTube Shorts",
    accent: "#FF0000",
    bg: "#fff5f5",
    desc: "Download YouTube Shorts videos",
    formats: ["MP4"],
    warn: true,
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-8 h-8">
        <rect width="48" height="48" rx="12" fill="#FF0000"/>
        <path d="M30 18l-4-4v3H18a4 4 0 0 0-4 4v8a4 4 0 0 0 4 4h12a4 4 0 0 0 4-4v-8a4 4 0 0 0-4-4h-2v-3zm-1 6v4.5l-6-3v-3l6 1.5z" fill="white"/>
      </svg>
    ),
  },
  {
    slug: "pinterest",
    name: "Pinterest",
    accent: "#E60023",
    bg: "#fff0f1",
    desc: "Save Pinterest videos and images",
    formats: ["MP4", "JPG"],
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-8 h-8">
        <rect width="48" height="48" rx="12" fill="#E60023"/>
        <path d="M24 9C15.7 9 9 15.7 9 24c0 6.4 4 12 9.7 14.4-.1-1.3-.2-3.4.3-4.8.4-1.3 2.8-11.9 2.8-11.9s-.7-1.4-.7-3.5c0-3.3 1.9-5.7 4.3-5.7 2 0 3 1.5 3 3.3 0 2-.1 5-.3 6.2-.7 2.8 1 4.9 2.9 4.9 3.5 0 6.2-3.7 6.2-9 0-4.7-3.4-8-8.2-8-5.6 0-8.8 4.2-8.8 8.5 0 1.7.6 3.5 1.4 4.5.2.2.2.4.1.6-.1.6-.5 2-.5 2.3 0 .4-.2.5-.4.3-1.5-.7-2.5-3-2.5-4.8 0-3.9 2.8-7.4 8.1-7.4 4.2 0 7.5 3 7.5 7 0 4.2-2.6 7.5-6.3 7.5-1.2 0-2.4-.6-2.8-1.4 0 0-.6 2.4-.8 2.9-.3 1-.9 2-1.4 2.8.9.3 1.9.5 3 .5 8.3 0 15-6.7 15-15S32.3 9 24 9z" fill="white"/>
      </svg>
    ),
  },
  {
    slug: "soundcloud",
    name: "SoundCloud",
    accent: "#FF5500",
    bg: "#fff5f0",
    desc: "Download SoundCloud tracks and playlists",
    formats: ["MP3"],
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-8 h-8">
        <rect width="48" height="48" rx="12" fill="#FF5500"/>
        <path d="M8 26a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm4-3c0-1.1-.4-2-.8-2.5-.1-.2-.2-.3-.2-.5 0-.6.5-1 1-1 .2 0 .4.1.6.2C13.6 20.1 14 21 14 22v4h-2v-3zm3-2c0-3 2-5.5 4.5-6 .3 0 .5.2.5.5v11.5H15V21zm5 5.5V14c0-.3.2-.5.5-.5C21 13.8 23 16 23 19v7.5h-3zM37 27h-12v-5.5c0-.5.4-1 .9-1.1 2.1-.5 3.8.7 4.5 2.3.7-1.2 1.9-2 3.4-2C36 20.7 38 22.7 38 25c0 1.1-.4 2-1 2zm0 0" fill="white"/>
      </svg>
    ),
  },
  {
    slug: "vimeo",
    name: "Vimeo",
    accent: "#1AB7EA",
    bg: "#f0fbff",
    desc: "Download Vimeo videos in HD",
    formats: ["MP4"],
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-8 h-8">
        <rect width="48" height="48" rx="12" fill="#1AB7EA"/>
        <path d="M38.9 18.1c-.2 4.1-3 9.7-8.5 16.8C25 42.1 20.3 45.5 16.5 45.5c-2.3 0-4.2-2.1-5.8-6.3l-3.2-11.7C6.4 23.3 5.1 21.2 3.8 21.2c-.3 0-1.3.6-3 1.7L0 21.7c1.8-1.6 3.7-3.2 5.4-4.9 2.4-2.1 4.2-3.2 5.4-3.3 2.8-.3 4.6 1.7 5.2 5.9.7 4.5 1.2 7.3 1.5 8.4.8 3.7 1.7 5.5 2.8 5.5.8 0 2-.5 3.5-1.6 1.5-1.1 3.4-3.6 4.7-6.1.5-1 .7-1.9.7-2.6 0-1.7-1-2.5-3-2.5-.6 0-1.3.1-2 .4 1.3-4.4 3.9-6.5 7.7-6.4 2.8.1 4.2 1.9 4 5.5z" fill="white"/>
      </svg>
    ),
  },
  {
    slug: "dailymotion",
    name: "Dailymotion",
    accent: "#003F8A",
    bg: "#f0f4ff",
    desc: "Download Dailymotion videos",
    formats: ["MP4"],
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-8 h-8">
        <rect width="48" height="48" rx="12" fill="#003F8A"/>
        <path d="M31 24c0 3.9-3.1 7-7 7s-7-3.1-7-7 3.1-7 7-7 7 3.1 7 7z" fill="#0091CE"/>
        <path d="M35 15.5V24c0 6.1-4.9 11-11 11s-11-4.9-11-11S17.9 13 24 13c2.4 0 4.6.7 6.4 2V11h4.6v4.5zM24 31c3.9 0 7-3.1 7-7s-3.1-7-7-7-7 3.1-7 7 3.1 7 7 7z" fill="white"/>
      </svg>
    ),
  },
];

export default function DownloadersPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Hero */}
      <section className="bg-[#1A1A2E] text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white text-xs font-medium px-3 py-1.5 rounded-full mb-6">
            <span>10 Platforms</span>
            <span className="w-1 h-1 bg-white/50 rounded-full"></span>
            <span>No Signup Required</span>
            <span className="w-1 h-1 bg-white/50 rounded-full"></span>
            <span>Direct Download</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Download from{" "}
            <span style={{ background: "linear-gradient(90deg,#FF4747,#FF8C42)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              anywhere
            </span>
          </h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto">
            Save videos, audio, and images from your favorite platforms — fast, free, and without watermarks.
          </p>
        </div>
      </section>

      {/* Grid */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {PLATFORMS.map(p => (
            <Link
              key={p.slug}
              href={`/downloaders/${p.slug}`}
              className="group bg-white border border-[#E2E8F0] rounded-2xl p-6 hover:border-[#FF4747]/40 hover:shadow-lg transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">{p.icon}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="font-bold text-[#1A1A2E] text-lg leading-tight">{p.name}</h2>
                    {p.warn && (
                      <span className="text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-full flex-shrink-0">
                        ToS Note
                      </span>
                    )}
                  </div>
                  <p className="text-[#64748B] text-sm leading-snug">{p.desc}</p>
                  <div className="flex gap-1.5 mt-3">
                    {p.formats.map(f => (
                      <span key={f} className="text-xs font-semibold bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] px-2 py-0.5 rounded-full">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-end">
                <span
                  className="text-xs font-semibold px-3 py-1.5 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: "linear-gradient(135deg,#FF4747,#FF8C42)" }}
                >
                  Download →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Legal Disclaimer */}
      <section className="max-w-4xl mx-auto px-4 pb-16">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-amber-900 mb-1">Important — Personal Use Only</h3>
              <p className="text-amber-800 text-sm leading-relaxed">
                These tools are provided for personal, lawful use only. <strong>Only download content you own or have explicit rights to.</strong> Downloading copyrighted content without permission may violate platform Terms of Service and applicable copyright laws (DMCA, EU Copyright Directive, etc.). By using these tools you agree to our{" "}
                <Link href="/terms" className="underline font-semibold">Terms of Service</Link>. We do not host or store any downloaded content on our servers.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
