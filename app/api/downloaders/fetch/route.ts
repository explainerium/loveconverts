import { NextRequest } from "next/server";
import { v4 as uuidv4 } from "uuid";
import db from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// In-memory rate limiter: IP → { count, resetAt }
const rateLimiter = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

const SUPPORTED_PLATFORMS = new Set([
  "tiktok", "instagram", "facebook", "twitter",
  "youtube", "youtube-shorts", "pinterest",
  "soundcloud", "vimeo", "dailymotion",
]);

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimiter.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimiter.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

function sanitizeUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) return null;
    if (url.length > 500) return null;
    // Normalize web.facebook.com → www.facebook.com (avoids redirect loops)
    let normalized = url;
    normalized = normalized.replace(/^(https?:\/\/)web\.facebook\.com/, "$1www.facebook.com");
    // Normalize m.facebook.com → www.facebook.com
    normalized = normalized.replace(/^(https?:\/\/)m\.facebook\.com/, "$1www.facebook.com");
    return normalized;
  } catch {
    return null;
  }
}

function isPlatformBlocked(platform: string): boolean {
  if (!db) return false;
  const row = db.prepare(
    "SELECT disabled FROM platform_blocklist WHERE platform = ?"
  ).get(platform) as { disabled: number } | undefined;
  return row?.disabled === 1;
}

function logStat(platform: string, format: string, success: boolean, errorType?: string) {
  if (!db) return;
  try {
    db.prepare(`
      INSERT INTO download_stats (id, platform, format, success, error_type)
      VALUES (?, ?, ?, ?, ?)
    `).run(uuidv4(), platform, format, success ? 1 : 0, errorType ?? null);
  } catch { /* non-critical */ }
}

function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return "";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}:${String(m % 60).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  // Rate limit
  if (!checkRateLimit(ip)) {
    return Response.json(
      { success: false, error: "Rate limit reached — please wait before trying again (20 requests/hour)." },
      { status: 429 }
    );
  }

  let body: { url?: string; platform?: string; format?: string; quality?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ success: false, error: "Invalid request body." }, { status: 400 });
  }

  const { url: rawUrl, platform = "unknown", format = "MP4" } = body;

  // Validate URL
  if (!rawUrl) {
    return Response.json({ success: false, error: "URL is required." }, { status: 400 });
  }
  const url = sanitizeUrl(rawUrl);
  if (!url) {
    return Response.json(
      { success: false, error: "Invalid URL. Please provide a valid http/https URL under 500 characters." },
      { status: 400 }
    );
  }

  // Validate platform
  if (!SUPPORTED_PLATFORMS.has(platform)) {
    return Response.json({ success: false, error: "Unsupported platform." }, { status: 400 });
  }

  // Check blocklist
  if (isPlatformBlocked(platform)) {
    logStat(platform, format, false, "blocked");
    return Response.json(
      { success: false, error: "This platform is temporarily unavailable. Please try again later." },
      { status: 503 }
    );
  }

  // yt-dlp path — check if the binary exists
  let ytDlpPath = process.env.YT_DLP_PATH || "";

  // If no env var set, try common locations
  if (!ytDlpPath) {
    const fs = await import("fs");
    const commonPaths = [
      "/usr/local/bin/yt-dlp",
      "/usr/bin/yt-dlp",
      "/home/" + (process.env.USER || process.env.HOME?.split("/").pop() || "") + "/.local/bin/yt-dlp",
      "/Users/explainerium/Library/Python/3.9/bin/yt-dlp", // macOS dev fallback
    ];
    for (const p of commonPaths) {
      if (fs.existsSync(p)) {
        ytDlpPath = p;
        break;
      }
    }
  }

  if (!ytDlpPath) {
    // Last resort: try "yt-dlp" from PATH
    try {
      const { execSync } = await import("child_process");
      const resolved = execSync("which yt-dlp", { encoding: "utf-8" }).trim();
      if (resolved) ytDlpPath = resolved;
    } catch { /* not on PATH */ }
  }

  if (!ytDlpPath) {
    logStat(platform, format, false, "no_ytdlp");
    return Response.json(
      { success: false, error: "Video downloading is not available in this deployment environment. This feature requires a custom server with yt-dlp installed." },
      { status: 503 }
    );
  }

  try {
    // Build yt-dlp CLI args directly for full control over flags
    const fs2 = await import("fs");
    const { execSync } = await import("child_process");

    const ytArgs = [
      "--dump-single-json",
      "--no-warnings",
      "--no-check-certificates",
      "--user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    ];

    // For YouTube: add JS runtime (Node.js) and use web client to bypass bot detection
    const isYouTubePlatform = ["youtube", "youtube-shorts"].includes(platform);
    if (isYouTubePlatform) {
      // Find Node.js path for yt-dlp JS runtime
      try {
        const nodePath = execSync("which node", { encoding: "utf-8" }).trim();
        if (nodePath) {
          ytArgs.push("--js-runtimes", `nodejs:${nodePath}`);
        }
      } catch { /* node not found on PATH, skip */ }

      // Use web player client to reduce bot detection
      ytArgs.push("--extractor-args", "youtube:player_client=web,default");
    }

    // Use cookies file if available (needed for YouTube bot detection on VPS)
    const cookiesPath = process.env.YT_DLP_COOKIES || "/var/www/loveconverts/cookies.txt";
    if (fs2.existsSync(cookiesPath)) {
      ytArgs.push("--cookies", cookiesPath);
    }

    ytArgs.push(url);

    // Execute yt-dlp and parse JSON output
    const rawOutput = execSync(`${ytDlpPath} ${ytArgs.map(a => `'${a.replace(/'/g, "'\\''")}'`).join(" ")}`, {
      encoding: "utf-8",
      timeout: 60000,
      maxBuffer: 50 * 1024 * 1024,
    });

    const info = JSON.parse(rawOutput) as Record<string, unknown>;

    const title = (info.title as string) || "Media";
    const thumbnail = (info.thumbnail as string) || null;
    const duration = formatDuration(info.duration as number);

    // Build format list from available formats
    const rawFormats = (info.formats as Array<Record<string, unknown>>) || [];
    const formats: { label: string; url: string; ext: string }[] = [];

    // Deduplicate and pick best per resolution
    const seen = new Set<string>();
    const qualityLabels: Record<string, string> = {
      "2160": "4K",
      "1440": "1440p",
      "1080": "1080p",
      "720": "720p",
      "480": "480p",
      "360": "360p",
      "240": "240p",
    };

    // Sort: prefer combined (V+A) formats, then by height descending
    const sorted = [...rawFormats].sort((a, b) => {
      const aHasAudio = (a.acodec as string) !== "none";
      const bHasAudio = (b.acodec as string) !== "none";
      const aHasVideo = (a.vcodec as string) !== "none";
      const bHasVideo = (b.vcodec as string) !== "none";
      const aCombined = aHasAudio && aHasVideo ? 1 : 0;
      const bCombined = bHasAudio && bHasVideo ? 1 : 0;
      // Prefer combined streams first
      if (bCombined !== aCombined) return bCombined - aCombined;
      // Then by height descending
      return ((b.height as number) || 0) - ((a.height as number) || 0);
    });

    for (const f of sorted) {
      const ext = (f.ext as string) || "mp4";
      const height = f.height as number | null;
      const acodec = (f.acodec as string) || "none";
      const vcodec = (f.vcodec as string) || "none";

      const directUrl = (f.url as string) || "";
      if (!directUrl.startsWith("http")) continue;

      if (format === "MP4") {
        // For video: ONLY include formats that have BOTH video + audio
        // This avoids DASH video-only streams (VP9 no audio, breaks QuickTime)
        if (vcodec === "none") continue;   // skip audio-only
        if (acodec === "none") continue;   // skip video-only (DASH)
      } else if (format === "MP3") {
        // For audio: only include audio streams
        if (acodec === "none") continue;
      }

      const label = height
        ? (qualityLabels[String(height)] || `${height}p`)
        : format === "MP3"
          ? "MP3"
          : "Best";

      if (!seen.has(label) && formats.length < 4) {
        seen.add(label);
        formats.push({ label, url: directUrl, ext: format === "MP3" ? "mp3" : "mp4" });
      }
    }

    // The top-level info.url is yt-dlp's "best" pick (usually combined V+A)
    const downloadUrl = (info.url as string) || formats[0]?.url || "";

    // These platforms have CDN URLs that block VPS IPs or require authentication.
    // Use yt-dlp for the actual download instead of proxying CDN URLs.
    const useYtDlpPlatforms = ["youtube", "youtube-shorts", "facebook", "instagram", "tiktok"];
    const shouldUseYtDlp = useYtDlpPlatforms.includes(platform);

    logStat(platform, format, true);

    return Response.json({
      success: true,
      title,
      thumbnail,
      duration,
      downloadUrl: downloadUrl || undefined,
      formats: formats.length > 0 ? formats : undefined,
      // Pass the original page URL so the stream proxy can use yt-dlp as fallback
      pageUrl: url,
      // Use yt-dlp for platforms with restricted CDN URLs
      useYtDlp: shouldUseYtDlp,
    });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);

    let errorMessage = "Failed to fetch media information.";
    let errorType = "unknown";

    if (msg.includes("Private") || msg.includes("private") || msg.includes("login required")) {
      errorMessage = "Private video — cannot access private content.";
      errorType = "private";
    } else if (msg.includes("not available") || msg.includes("removed") || msg.includes("deleted")) {
      errorMessage = "This video is unavailable or has been removed.";
      errorType = "unavailable";
    } else if (msg.includes("Unsupported URL") || msg.includes("unsupported")) {
      errorMessage = "Unsupported URL — please check the link and try again.";
      errorType = "unsupported";
    } else if (msg.includes("rate") || msg.includes("429")) {
      errorMessage = "The platform is rate-limiting requests. Please try again in a moment.";
      errorType = "rate_limited";
    }

    logStat(platform, format, false, errorType);

    return Response.json({ success: false, error: errorMessage }, { status: 422 });
  }
}
