import type { NextRequest } from "next/server";
import { promises as fs, createWriteStream, existsSync } from "fs";
import path from "path";
import { spawn } from "child_process";
import { pipeline } from "stream/promises";
import {
  createJob,
  ensureJobsDir,
  setJobPercent,
  completeJob,
  failJob,
  updateJob,
} from "@/lib/jobs";
import { findYtDlp } from "@/lib/yt-dlp";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Kick off a download as a background job.
 * Returns { jobId } immediately. Frontend polls /api/jobs/status?id=...
 * and then downloads the final file from /api/jobs/result?id=...
 *
 * Two modes:
 *  - yt-dlp mode: runs yt-dlp and parses "[download] X% of Y" from stderr
 *  - direct proxy mode: fetches a CDN URL and counts bytes against Content-Length
 */

const startLimiter = new Map<string, { count: number; resetAt: number }>();
const START_LIMIT = 15;
const START_WINDOW_MS = 60 * 60 * 1000;

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function checkStartLimit(ip: string): boolean {
  const now = Date.now();
  const entry = startLimiter.get(ip);
  if (!entry || now > entry.resetAt) {
    startLimiter.set(ip, { count: 1, resetAt: now + START_WINDOW_MS });
    return true;
  }
  if (entry.count >= START_LIMIT) return false;
  entry.count++;
  return true;
}

function sanitizeFilename(name: string): string {
  return name
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/[<>:"/\\|?*]/g, "_")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 200) || "download";
}

/**
 * Run yt-dlp and parse its --newline progress output.
 * Downloads to outputPath, reports percent via onProgress.
 */
function runYtDlp(
  pageUrl: string,
  ext: string,
  outputPath: string,
  onProgress: (percent: number, stage?: string) => void
): Promise<void> {
  const ytDlpPath = findYtDlp() || "/usr/local/bin/yt-dlp";

  return new Promise((resolve, reject) => {
    const args: string[] = [
      "-f",
      ext === "mp3" ? "bestaudio[ext=m4a]/bestaudio" : "best[ext=mp4]/best",
      "--no-warnings",
      "--no-playlist",
      "--no-check-certificates",
      "--newline", // critical: one progress line per update instead of \r carriage returns
      "--progress",
      "--user-agent",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      "-o",
      outputPath,
    ];

    const isYouTube = pageUrl.includes("youtube.com") || pageUrl.includes("youtu.be");
    if (isYouTube) {
      args.push("--extractor-args", "youtube:player_client=mediaconnect");
    }

    const cookiesPath = process.env.YT_DLP_COOKIES || "/var/www/loveconverts/cookies.txt";
    if (existsSync(cookiesPath)) {
      args.push("--cookies", cookiesPath);
    }

    args.push(pageUrl);

    const child = spawn(ytDlpPath, args, { timeout: 300_000 });
    let stderr = "";
    let lastPct = 0;

    // yt-dlp writes progress to stdout with --newline
    const progressRe = /\[download\]\s+(\d+(?:\.\d+)?)%/;

    const parseLine = (line: string) => {
      const m = line.match(progressRe);
      if (m) {
        const pct = parseFloat(m[1]);
        if (!isNaN(pct) && pct > lastPct) {
          lastPct = pct;
          onProgress(pct, "Downloading from source");
        }
      } else if (line.includes("Merging")) {
        onProgress(Math.max(lastPct, 95), "Merging audio & video");
      } else if (line.includes("[ExtractAudio]")) {
        onProgress(Math.max(lastPct, 95), "Extracting audio");
      }
    };

    let stdoutBuf = "";
    child.stdout.on("data", (chunk: Buffer) => {
      stdoutBuf += chunk.toString();
      const lines = stdoutBuf.split("\n");
      stdoutBuf = lines.pop() || "";
      for (const line of lines) parseLine(line);
    });

    child.stderr.on("data", (data: Buffer) => {
      stderr += data.toString();
      for (const line of data.toString().split("\n")) parseLine(line);
    });

    child.on("close", (code) => {
      if (code !== 0) {
        const msg = stderr.trim();
        if (msg.includes("403") || msg.includes("Forbidden")) {
          reject(new Error(
            "YouTube is blocking this download. Try a different video or try again later."
          ));
        } else if (msg.includes("Private") || msg.includes("private")) {
          reject(new Error("This video is private and cannot be downloaded."));
        } else {
          reject(new Error(msg || "yt-dlp download failed"));
        }
        return;
      }
      onProgress(100, "Download complete");
      resolve();
    });

    child.on("error", (err) => {
      reject(new Error(err.message || "yt-dlp failed to start"));
    });
  });
}

/**
 * Direct proxy: fetch CDN URL and pipe to disk, reporting byte progress.
 */
async function proxyDownload(
  mediaUrl: string,
  outputPath: string,
  onProgress: (pct: number, stage?: string) => void,
  updateOriginalSize: (bytes: number) => void
): Promise<void> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 300_000);

  try {
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

    if (!upstream.ok) throw new Error(`Source returned ${upstream.status}`);

    const ct = upstream.headers.get("content-type") || "";
    if (ct.includes("text/html") || ct.includes("application/json")) {
      throw new Error("The download link has expired. Please fetch it again.");
    }

    const totalStr = upstream.headers.get("content-length");
    const total = totalStr ? parseInt(totalStr) : 0;
    if (total > 0) updateOriginalSize(total);

    if (!upstream.body) throw new Error("Empty response body");

    const reader = upstream.body.getReader();
    const fileStream = createWriteStream(outputPath);
    let loaded = 0;

    async function* iterate() {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        loaded += value.byteLength;
        if (total > 0) {
          onProgress((loaded / total) * 100, "Downloading from source");
        } else {
          // Unknown length — show a smooth fake progress
          onProgress(Math.min(90, loaded / (5 * 1024 * 1024) * 10), "Downloading from source");
        }
        yield value;
      }
    }

    // Use pipeline for backpressure + proper error handling
    const { Readable } = await import("stream");
    await pipeline(Readable.from(iterate()), fileStream);
    onProgress(100, "Download complete");
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!checkStartLimit(ip)) {
    return Response.json(
      { error: "Download limit reached. Please wait before trying again." },
      { status: 429 }
    );
  }

  let body: {
    url?: string;
    title?: string;
    ext?: string;
    pageUrl?: string;
    useYtDlp?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { url: mediaUrl, title = "download", ext = "mp4", pageUrl, useYtDlp } = body;
  const filename = `${sanitizeFilename(title)}.${ext}`;

  // Validate URL if provided
  if (mediaUrl) {
    try {
      const parsed = new URL(mediaUrl);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        return Response.json({ error: "Invalid URL protocol" }, { status: 400 });
      }
    } catch {
      return Response.json({ error: "Invalid URL" }, { status: 400 });
    }
  }

  if (!mediaUrl && !pageUrl) {
    return Response.json({ error: "Missing url or pageUrl" }, { status: 400 });
  }

  // Create job & temp output path
  const jobsDir = await ensureJobsDir();
  const job = createJob("Starting download");
  const outputPath = path.join(jobsDir, `dl-${job.id}.${ext}`);
  job.tempPaths.push(outputPath);

  const contentType = ext === "mp3"
    ? "audio/mpeg"
    : ext === "gif"
    ? "image/gif"
    : ext === "jpg"
    ? "image/jpeg"
    : "video/mp4";

  // Run download in background
  (async () => {
    setJobPercent(job.id, 1, "Connecting to source");
    try {
      if (useYtDlp && pageUrl) {
        await runYtDlp(pageUrl, ext, outputPath, (pct, stage) => {
          setJobPercent(job.id, pct, stage);
        });
      } else if (mediaUrl) {
        await proxyDownload(
          mediaUrl,
          outputPath,
          (pct, stage) => setJobPercent(job.id, pct, stage),
          (bytes) => updateJob(job.id, { originalSize: bytes })
        );
      } else {
        throw new Error("No download source provided");
      }

      const stat = await fs.stat(outputPath);
      if (stat.size < 1000) {
        throw new Error("Downloaded file is empty. The source may be unavailable.");
      }
      completeJob(job.id, outputPath, filename, contentType, stat.size);
    } catch (err) {
      console.error("Download job error:", err);
      failJob(job.id, err instanceof Error ? err.message : "Download failed");
    }
  })();

  return Response.json({ jobId: job.id });
}
