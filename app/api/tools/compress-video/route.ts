import type { NextRequest } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import ffprobeInstaller from "@ffprobe-installer/ffprobe";
import { auth } from "@/auth";
import { checkAndIncrementLimit, recordConversion } from "@/lib/limits";
import {
  createJob,
  ensureJobsDir,
  setJobPercent,
  completeJob,
  failJob,
  updateJob,
} from "@/lib/jobs";

ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

type Quality = "low" | "medium" | "high" | "extreme";
type Format = "mp4" | "webm";

const CRF: Record<Quality, number> = {
  extreme: 34,
  high:    30,
  medium:  26,
  low:     22,
};

/**
 * Run ffmpeg with fluent-ffmpeg's built-in progress events.
 * fluent-ffmpeg parses ffmpeg stderr and emits .on('progress', { percent }).
 */
function runFfmpeg(
  inputPath: string,
  outputPath: string,
  quality: Quality,
  format: Format,
  onProgress: (percent: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const crf = CRF[quality];
    const cmd = ffmpeg(inputPath)
      .outputOptions([
        "-preset", "veryfast", // faster encoding, slightly larger file
        "-movflags", "+faststart",
        "-pix_fmt", "yuv420p",
      ]);

    if (format === "mp4") {
      cmd.videoCodec("libx264")
         .audioCodec("aac")
         .audioBitrate("128k")
         .outputOptions(["-crf", String(crf)])
         .format("mp4");
    } else {
      cmd.videoCodec("libvpx-vp9")
         .audioCodec("libopus")
         .audioBitrate("96k")
         .outputOptions([
           "-crf", String(crf + 2),
           "-b:v", "0",
           "-row-mt", "1",
           "-deadline", "realtime",
           "-cpu-used", "5",
         ])
         .format("webm");
    }

    cmd.on("progress", (info: { percent?: number }) => {
         if (typeof info.percent === "number" && !isNaN(info.percent)) {
           onProgress(info.percent);
         }
       })
       .on("end", () => {
         onProgress(100);
         resolve();
       })
       .on("error", (err) => reject(err))
       .save(outputPath);
  });
}

export async function POST(request: NextRequest) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let session: any = null;
  try { session = await auth(); } catch { /* anonymous */ }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) return Response.json({ error: "No file provided" }, { status: 400 });
    if (!file.type.startsWith("video/")) {
      return Response.json({ error: "File is not a video" }, { status: 400 });
    }

    const fileSizeMB = file.size / (1024 * 1024);

    // Size gating per plan (videos get a generous cap)
    if (session?.user?.id) {
      const plan = session.user.plan || "free";
      const maxMB = plan === "pro" ? 500 : 100;
      if (fileSizeMB > maxMB) {
        return Response.json(
          { error: `Video exceeds ${maxMB} MB. ${plan === "free" ? "Upgrade to Pro for up to 500 MB." : ""}` },
          { status: 400 }
        );
      }
      const check = checkAndIncrementLimit(session.user.id);
      if (!check.allowed) {
        return Response.json({ error: check.reason, code: "RATE_LIMIT" }, { status: 429 });
      }
    } else {
      if (fileSizeMB > 50) {
        return Response.json(
          { error: "Video exceeds 50 MB. Sign up free to compress larger videos." },
          { status: 400 }
        );
      }
    }

    const quality = ((formData.get("quality") as string) || "medium") as Quality;
    const format = ((formData.get("format") as string) || "mp4") as Format;
    if (!["low", "medium", "high", "extreme"].includes(quality)) {
      return Response.json({ error: "Invalid quality" }, { status: 400 });
    }
    if (!["mp4", "webm"].includes(format)) {
      return Response.json({ error: "Invalid format" }, { status: 400 });
    }

    // Prepare temp paths
    const jobsDir = await ensureJobsDir();
    const job = createJob("Preparing video");
    updateJob(job.id, { originalSize: file.size });

    const inputPath = path.join(jobsDir, `in-${job.id}`);
    const outputPath = path.join(jobsDir, `out-${job.id}.${format}`);
    job.tempPaths.push(inputPath, outputPath);

    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(inputPath, buffer);

    const safeBase = (file.name.replace(/\.[^/.]+$/, "") || "video")
      .replace(/[^\x20-\x7E]/g, "")
      .replace(/\s+/g, "_") || "video";
    const outputName = `${safeBase}-compressed.${format}`;
    const contentType = format === "mp4" ? "video/mp4" : "video/webm";

    // Start encoding in the background — don't block the response
    setJobPercent(job.id, 1, "Starting compression");

    (async () => {
      try {
        await runFfmpeg(inputPath, outputPath, quality, format, (percent) => {
          setJobPercent(job.id, percent, "Compressing video");
        });

        const stat = await fs.stat(outputPath);
        completeJob(job.id, outputPath, outputName, contentType, stat.size);

        // Delete source immediately — we only need the output now
        await fs.unlink(inputPath).catch(() => {});

        if (session?.user?.id) {
          recordConversion({
            userId: session.user.id,
            filename: file.name,
            fromFormat: file.type.split("/")[1] || "video",
            toFormat: format,
            tool: "compress-video",
            originalSize: file.size,
            convertedSize: stat.size,
          });
        }
      } catch (err) {
        console.error("Video compress error:", err);
        failJob(job.id, err instanceof Error ? err.message : "Video compression failed");
      }
    })();

    return Response.json({ jobId: job.id });
  } catch (err) {
    console.error("Video compress request error:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Request failed" },
      { status: 500 }
    );
  }
}
