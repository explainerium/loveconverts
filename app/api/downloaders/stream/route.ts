import { NextRequest } from "next/server";
import { spawn } from "child_process";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Server-side proxy for video/audio downloads.
 *
 * Two strategies:
 * 1. PROXY mode (Instagram, TikTok, Facebook, etc.):
 *    Fetch CDN URL server-side and stream to client.
 *
 * 2. YT-DLP mode (YouTube):
 *    YouTube CDN URLs are signature-locked. Even proxying fails with 403.
 *    Instead, we run yt-dlp to download the file server-side and pipe it.
 */

const streamLimiter = new Map<string, { count: number; resetAt: number }>();
const STREAM_LIMIT = 15;
const STREAM_WINDOW_MS = 60 * 60 * 1000;

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function checkStreamLimit(ip: string): boolean {
  const now = Date.now();
  const entry = streamLimiter.get(ip);
  if (!entry || now > entry.resetAt) {
    streamLimiter.set(ip, { count: 1, resetAt: now + STREAM_WINDOW_MS });
    return true;
  }
  if (entry.count >= STREAM_LIMIT) return false;
  entry.count++;
  return true;
}

function sanitizeFilename(name: string): string {
  return name
    // Remove non-ASCII characters (emoji, Bengali, Arabic, etc.) to avoid ByteString errors
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/[<>:"/\\|?*]/g, "_")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 200) || "download";
}

/**
 * Download via yt-dlp (for YouTube and as fallback).
 * Uses spawn with binary stdout for reliable binary data handling.
 * yt-dlp handles all authentication, signatures, and merging.
 */
function downloadWithYtDlp(
  pageUrl: string,
  format: string
): Promise<Buffer> {
  const ytDlpPath =
    process.env.YT_DLP_PATH ||
    "/usr/local/bin/yt-dlp";

  return new Promise((resolve, reject) => {
    const args = [
      "-f",
      format === "mp3" ? "bestaudio[ext=m4a]/bestaudio" : "best[ext=mp4]/best",
      "--no-warnings",
      "--no-playlist",
      "--no-check-certificates",
      "--user-agent",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      "-o",
      "-", // output to stdout
      pageUrl,
    ];

    // Add cookies if available
    const fs = require("fs");
    const cookiesPath = process.env.YT_DLP_COOKIES || "/var/www/loveconverts/cookies.txt";
    if (fs.existsSync(cookiesPath)) {
      args.splice(args.length - 1, 0, "--cookies", cookiesPath);
    }

    const child = spawn(ytDlpPath, args, { timeout: 120000 });
    const chunks: Buffer[] = [];
    let stderr = "";

    child.stdout.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });

    child.stderr.on("data", (data: Buffer) => {
      stderr += data.toString();
    });

    child.on("close", (code) => {
      if (code !== 0) {
        const msg = stderr.trim();
        if (msg.includes("403") || msg.includes("Forbidden")) {
          reject(
            new Error(
              "YouTube is blocking this download. YouTube actively prevents automated downloads. " +
              "Try again later, or use a shorter/newer video."
            )
          );
        } else if (msg.includes("Private") || msg.includes("private")) {
          reject(new Error("This video is private and cannot be downloaded."));
        } else {
          reject(new Error(msg || "yt-dlp download failed"));
        }
        return;
      }
      resolve(Buffer.concat(chunks));
    });

    child.on("error", (err) => {
      reject(new Error(err.message || "yt-dlp process failed to start"));
    });
  });
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!checkStreamLimit(ip)) {
    return Response.json(
      { error: "Download limit reached. Please wait before trying again." },
      { status: 429 }
    );
  }

  let body: { url?: string; title?: string; ext?: string; pageUrl?: string; useYtDlp?: boolean };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { url: mediaUrl, title = "download", ext = "mp4", pageUrl, useYtDlp } = body;
  const filename = `${sanitizeFilename(title)}.${ext}`;

  // ─── Strategy 1: yt-dlp direct download (YouTube, or when requested) ──────
  if (useYtDlp && pageUrl) {
    try {
      const buffer = await downloadWithYtDlp(pageUrl, ext);

      if (buffer.length < 1000) {
        return Response.json(
          { error: "Download produced an empty file. The video may be unavailable." },
          { status: 502 }
        );
      }

      const arrayBuf = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
      return new Response(arrayBuf, {
        status: 200,
        headers: {
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Content-Type": ext === "mp3" ? "audio/mpeg" : "video/mp4",
          "Content-Length": buffer.length.toString(),
          "Cache-Control": "no-store",
        },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("yt-dlp download error:", msg);

      // Pass through yt-dlp's specific error message
      const isYouTubeBlock = msg.includes("403") || msg.includes("blocking") || msg.includes("Forbidden");
      return Response.json(
        {
          error: isYouTubeBlock
            ? "YouTube is currently blocking automated downloads. This is a known limitation — YouTube actively prevents third-party tools from downloading videos. Please try a different video or try again later."
            : msg || "Download failed. The video may be private or unavailable.",
        },
        { status: isYouTubeBlock ? 403 : 500 }
      );
    }
  }

  // ─── Strategy 2: Proxy CDN URL (Instagram, TikTok, Facebook, etc.) ────────
  if (!mediaUrl) {
    return Response.json({ error: "Missing url or pageUrl" }, { status: 400 });
  }

  try {
    const parsed = new URL(mediaUrl);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return Response.json({ error: "Invalid URL protocol" }, { status: 400 });
    }
  } catch {
    return Response.json({ error: "Invalid URL" }, { status: 400 });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120_000);

    const upstream = await fetch(mediaUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "*/*",
        "Accept-Encoding": "identity",
        Referer: mediaUrl,
      },
      redirect: "follow",
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!upstream.ok) {
      // If proxy fails, fall back to yt-dlp if we have a pageUrl
      if (pageUrl) {
        try {
          const buffer = await downloadWithYtDlp(pageUrl, ext);
          if (buffer.length > 1000) {
            const fallbackBuf = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
            return new Response(fallbackBuf, {
              status: 200,
              headers: {
                "Content-Disposition": `attachment; filename="${filename}"`,
                "Content-Type": ext === "mp3" ? "audio/mpeg" : "video/mp4",
                "Content-Length": buffer.length.toString(),
                "Cache-Control": "no-store",
              },
            });
          }
        } catch { /* fall through to error */ }
      }

      return Response.json(
        { error: `Source returned ${upstream.status}. Please fetch the download link again.` },
        { status: 502 }
      );
    }

    const ct = upstream.headers.get("content-type") || "";
    if (ct.includes("text/html") || ct.includes("application/json")) {
      return Response.json(
        { error: "The download link has expired. Please fetch the video info again." },
        { status: 410 }
      );
    }

    const buffer = await upstream.arrayBuffer();

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Type": ct || "application/octet-stream",
        "Content-Length": buffer.byteLength.toString(),
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("abort")) {
      return Response.json({ error: "Download timed out." }, { status: 504 });
    }
    console.error("Stream proxy error:", msg);
    return Response.json({ error: "Failed to download. Please try again." }, { status: 500 });
  }
}
