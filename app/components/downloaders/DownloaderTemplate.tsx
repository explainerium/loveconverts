"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Download, AlertTriangle, ExternalLink, CheckCircle, Clock, XCircle, Loader2, PlayCircle } from "lucide-react";
import { useToast } from "@/app/components/Toast";

export interface PlatformConfig {
  slug: string;
  name: string;
  description: string;
  accent: string;
  icon: React.ReactNode;
  formats: ("MP4" | "MP3" | "GIF" | "JPG")[];
  supportsAudio?: boolean;
  urlExamples: string[];
  howToSteps: [string, string, string];
  isYouTube?: boolean;
  relatedPlatforms: { slug: string; name: string }[];
}

interface DownloadResult {
  success: boolean;
  title?: string;
  thumbnail?: string;
  duration?: string;
  downloadUrl?: string;
  formats?: { label: string; url: string; ext: string }[];
  error?: string;
  pageUrl?: string;
  useYtDlp?: boolean;
}

interface RecentDownload {
  platform: string;
  title: string;
  url: string;
  timestamp: number;
}

function formatDuration(seconds: number): string {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function getRecent(): RecentDownload[] {
  try {
    return JSON.parse(sessionStorage.getItem("lc_recent_downloads") || "[]");
  } catch { return []; }
}

function addRecent(item: RecentDownload) {
  const list = [item, ...getRecent().filter(r => r.url !== item.url)].slice(0, 5);
  sessionStorage.setItem("lc_recent_downloads", JSON.stringify(list));
}

function Thumbnail({ src }: { src?: string | null }) {
  const [failed, setFailed] = useState(false);
  const [proxySrc, setProxySrc] = useState<string | null>(null);

  useEffect(() => {
    setFailed(false);
    setProxySrc(null);
  }, [src]);

  if (!src || failed) {
    return (
      <div className="w-28 h-20 rounded-lg bg-gradient-to-br from-[#1A1A2E] to-[#2D2D44] flex items-center justify-center flex-shrink-0">
        <PlayCircle size={28} className="text-white/40" />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={proxySrc || src}
      alt=""
      className="w-28 h-20 rounded-lg object-cover flex-shrink-0 bg-gray-100"
      referrerPolicy="no-referrer"
      crossOrigin="anonymous"
      onError={() => {
        if (!proxySrc && src) {
          // First failure — try loading through our proxy
          setProxySrc(`/api/downloaders/thumbnail?url=${encodeURIComponent(src)}`);
        } else {
          // Proxy also failed — show placeholder
          setFailed(true);
        }
      }}
    />
  );
}

export default function DownloaderTemplate({ config }: { config: PlatformConfig }) {
  const toast = useToast();
  const [url, setUrl] = useState("");
  const [format, setFormat] = useState<string>(config.formats[0]);
  const [quality, setQuality] = useState("best");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DownloadResult | null>(null);
  const [urlDetected, setUrlDetected] = useState(false);
  const [showYTWarning, setShowYTWarning] = useState(false);
  const [ytAccepted, setYtAccepted] = useState(false);
  const [recent, setRecent] = useState<RecentDownload[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setRecent(getRecent().filter(r => r.platform === config.slug));
    if (config.isYouTube) {
      const accepted = sessionStorage.getItem("yt_accepted");
      if (accepted && Date.now() - parseInt(accepted) < 86400000) {
        setYtAccepted(true);
      } else {
        setShowYTWarning(true);
      }
    }
  }, [config.isYouTube, config.slug]);

  function handleUrlChange(val: string) {
    setUrl(val);
    setResult(null);
    setUrlDetected(val.includes(config.slug.replace("-shorts", "").replace("youtube", "youtu")) || val.includes("youtu.be") || val.includes(config.slug));
  }

  async function handleFetch(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;

    const trimmed = url.trim();
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
      toast.error("Please enter a valid URL starting with http:// or https://");
      return;
    }
    if (trimmed.length > 500) {
      toast.error("URL is too long");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/downloaders/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed, platform: config.slug, format, quality }),
      });
      const data = await res.json();
      setResult(data);

      if (data.success && data.title) {
        addRecent({ platform: config.slug, title: data.title, url: trimmed, timestamp: Date.now() });
        setRecent(getRecent().filter(r => r.platform === config.slug));
        toast.success("Media info fetched! Click Download to save.");
      } else if (!data.success) {
        toast.error(data.error || "Failed to fetch media info.");
      }
    } catch {
      setResult({ success: false, error: "Network error. Please try again." });
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState("");

  async function handleDownload(downloadUrl: string, label?: string) {
    const title = result?.title || "download";
    const ext = format === "MP3" ? "mp3" : format === "GIF" ? "gif" : format === "JPG" ? "jpg" : "mp4";

    setDownloading(true);
    setDownloadProgress("Connecting to server...");

    try {
      // POST to our server-side proxy.
      // For YouTube: uses yt-dlp to download directly (CDN URLs are signature-locked)
      // For others: proxies the CDN URL server-side
      setDownloadProgress(
        result?.useYtDlp
          ? "Downloading via yt-dlp (may take a moment)..."
          : "Downloading via server..."
      );
      const res = await fetch("/api/downloaders/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: downloadUrl,
          title,
          ext,
          pageUrl: result?.pageUrl,
          useYtDlp: result?.useYtDlp,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Download failed" }));
        toast.error(data.error || `Download failed (${res.status}). Try fetching the link again.`);
        return;
      }

      setDownloadProgress("Saving file...");

      // Read as blob for reliable binary handling
      const blob = await res.blob();

      if (blob.size < 1000 && blob.type.includes("json")) {
        // Server returned an error as JSON despite 200 (shouldn't happen, but safety check)
        const text = await blob.text();
        try {
          const err = JSON.parse(text);
          toast.error(err.error || "Download failed");
        } catch {
          toast.error("Download failed — received invalid data");
        }
        return;
      }

      // Create a blob URL and trigger download
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `${title.replace(/[<>:"/\\|?*]/g, "_")}.${ext}`;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();

      // Cleanup
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
      }, 500);

      toast.success(`${label || format} downloaded successfully!`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Network error";
      toast.error(`Download failed: ${msg}. Try fetching the link again.`);
    } finally {
      setDownloading(false);
      setDownloadProgress("");
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* YouTube warning modal */}
      {config.isYouTube && showYTWarning && !ytAccepted && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={20} className="text-amber-600" />
              </div>
              <h2 className="text-xl font-bold text-[#1A1A2E]">Before You Continue</h2>
            </div>
            <p className="text-[#64748B] text-sm leading-relaxed mb-6">
              YouTube downloading may conflict with YouTube&apos;s Terms of Service. <strong className="text-[#1A1A2E]">Only download videos you own or have explicit permission to download.</strong> We do not host or distribute any YouTube content.
            </p>
            <div className="flex gap-3">
              <Link href="/downloaders" className="flex-1 text-center py-2.5 rounded-xl border border-[#E2E8F0] text-sm font-medium text-[#64748B] hover:bg-gray-50 transition-colors">
                Go Back
              </Link>
              <button
                onClick={() => {
                  sessionStorage.setItem("yt_accepted", Date.now().toString());
                  setYtAccepted(true);
                  setShowYTWarning(false);
                }}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
                style={{ background: "linear-gradient(135deg,#FF4747,#FF8C42)" }}
              >
                I Understand, Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero */}
      <section className="bg-[#1A1A2E] py-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex justify-center mb-4">{config.icon}</div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{config.name} Downloader</h1>
          <p className="text-white/60 mb-5">{config.description}</p>
          <div className="flex justify-center flex-wrap gap-2">
            <span className="bg-white/10 text-white text-xs font-medium px-3 py-1 rounded-full">Free</span>
            <span className="bg-white/10 text-white text-xs font-medium px-3 py-1 rounded-full">Fast</span>
            <span className="bg-white/10 text-white text-xs font-medium px-3 py-1 rounded-full">No Signup</span>
            {config.formats.map(f => (
              <span key={f} className="bg-white/10 text-white text-xs font-medium px-3 py-1 rounded-full">{f}</span>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Disclaimer */}
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6 text-sm text-amber-800">
          <AlertTriangle size={16} className="flex-shrink-0 mt-0.5 text-amber-600" />
          <span>For personal use only. Only download content you own or have rights to. <Link href="/terms" className="underline font-semibold">Terms of Service</Link></span>
        </div>

        {/* URL Input */}
        {(!config.isYouTube || ytAccepted) && (
          <form onSubmit={handleFetch} className="bg-white border border-[#E2E8F0] rounded-2xl p-6 mb-6 shadow-sm">
            <div className="mb-4">
              <label className="block text-sm font-semibold text-[#1A1A2E] mb-2">
                Paste {config.name} URL
              </label>
              <div>
                <input
                  ref={inputRef}
                  type="url"
                  value={url}
                  onChange={e => handleUrlChange(e.target.value)}
                  placeholder={config.urlExamples[0]}
                  className="w-full px-4 py-3 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF4747]/30 focus:border-[#FF4747] transition-colors"
                />
                {urlDetected && url && (
                  <span className="flex items-center gap-1 text-xs text-green-600 font-medium mt-1.5 ml-1">
                    <CheckCircle size={12} />
                    Detected
                  </span>
                )}
              </div>
            </div>

            {/* Format + Quality */}
            <div className="flex flex-wrap gap-3 mb-4">
              {config.formats.length > 1 && (
                <div className="flex-1 min-w-[120px]">
                  <label className="block text-xs font-medium text-[#64748B] mb-1">Format</label>
                  <select
                    value={format}
                    onChange={e => setFormat(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF4747]/30"
                  >
                    {config.formats.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              )}
              <div className="flex-1 min-w-[140px]">
                <label className="block text-xs font-medium text-[#64748B] mb-1">Quality</label>
                <select
                  value={quality}
                  onChange={e => setQuality(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF4747]/30"
                >
                  <option value="best">Best Available</option>
                  <option value="720">720p</option>
                  <option value="480">480p</option>
                  <option value="360">360p</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg,#FF4747,#FF8C42)" }}
            >
              {loading ? <><Loader2 size={16} className="animate-spin" /> Fetching...</> : <><Download size={16} /> Get Download Link</>}
            </button>
          </form>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 mb-6 animate-pulse">
            <div className="flex gap-4">
              <div className="w-24 h-16 bg-gray-200 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
                <div className="h-3 bg-gray-200 rounded w-1/4" />
              </div>
            </div>
          </div>
        )}

        {/* Result card */}
        {!loading && result && (
          <div className={`bg-white border rounded-2xl p-6 mb-6 shadow-sm ${result.success ? "border-green-200" : "border-red-200"}`}>
            {result.success ? (
              <>
                <div className="flex items-start gap-4">
                  <Thumbnail src={result.thumbnail} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                      <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">Ready to download</span>
                    </div>
                    <h3 className="font-semibold text-[#1A1A2E] text-sm leading-snug line-clamp-2 mb-1">
                      {result.title || "Media found"}
                    </h3>
                    {result.duration && (
                      <span className="inline-flex items-center gap-1 text-xs text-[#64748B]">
                        <Clock size={11} /> {result.duration}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {downloading && (
                    <div className="w-full flex items-center gap-2 text-sm text-[#64748B] mb-2 bg-[#F8FAFC] rounded-lg px-3 py-2 border border-[#E2E8F0]">
                      <Loader2 size={14} className="animate-spin text-[#FF4747] flex-shrink-0" />
                      <span>{downloadProgress || "Downloading..."}</span>
                    </div>
                  )}
                  {result.formats && result.formats.length > 0 ? (
                    result.formats.map((f, i) => (
                      <button
                        key={i}
                        onClick={() => handleDownload(f.url, f.label)}
                        disabled={downloading}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all shadow-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-wait"
                        style={{ background: "linear-gradient(135deg,#FF4747,#FF8C42)" }}
                      >
                        <Download size={14} />
                        {f.label} ({f.ext.toUpperCase()})
                      </button>
                    ))
                  ) : result.downloadUrl ? (
                    <button
                      onClick={() => handleDownload(result.downloadUrl!)}
                      disabled={downloading}
                      className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all shadow-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-wait"
                      style={{ background: "linear-gradient(135deg,#FF4747,#FF8C42)" }}
                    >
                      <Download size={14} />
                      Download {format}
                    </button>
                  ) : null}
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-[#64748B] border border-[#E2E8F0] hover:bg-gray-50 transition-colors"
                  >
                    <ExternalLink size={14} />
                    View Original
                  </a>
                </div>
              </>
            ) : (
              <div className="flex items-start gap-3">
                <XCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-700 mb-0.5">Download Failed</p>
                  <p className="text-sm text-red-600">{result.error || "An unexpected error occurred. Please try again."}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Recent downloads */}
        {recent.length > 0 && (
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 mb-6">
            <h3 className="text-sm font-semibold text-[#1A1A2E] mb-3">Recent Downloads (this session)</h3>
            <div className="space-y-2">
              {recent.map((r, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <span className="text-[#64748B] truncate flex-1">{r.title}</span>
                  <button
                    onClick={() => { setUrl(r.url); handleUrlChange(r.url); }}
                    className="text-xs text-[#FF4747] font-medium hover:underline flex-shrink-0"
                  >
                    Re-fetch
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* How to use */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 mb-6">
          <h2 className="font-bold text-[#1A1A2E] mb-4">How to Download from {config.name}</h2>
          <div className="space-y-3">
            {config.howToSteps.map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ background: "linear-gradient(135deg,#FF4747,#FF8C42)" }}
                >
                  {i + 1}
                </div>
                <p className="text-sm text-[#64748B] leading-relaxed pt-0.5">{step}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Supported URLs */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 mb-6">
          <h2 className="font-bold text-[#1A1A2E] mb-3">Supported URL Formats</h2>
          <div className="space-y-1.5">
            {config.urlExamples.map((ex, i) => (
              <code key={i} className="block text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-2 text-[#64748B] font-mono">
                {ex}
              </code>
            ))}
          </div>
        </div>

        {/* Related platforms */}
        {config.relatedPlatforms.length > 0 && (
          <div>
            <h2 className="font-bold text-[#1A1A2E] mb-3">Other Downloaders</h2>
            <div className="flex flex-wrap gap-2">
              {config.relatedPlatforms.map(p => (
                <Link
                  key={p.slug}
                  href={`/downloaders/${p.slug}`}
                  className="px-4 py-2 rounded-xl border border-[#E2E8F0] text-sm font-medium text-[#64748B] hover:border-[#FF4747]/40 hover:text-[#FF4747] transition-colors bg-white"
                >
                  {p.name} Downloader
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
