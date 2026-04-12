import type { NextRequest } from "next/server";
import { promises as fs, createReadStream } from "fs";
import { getJob, cleanupJob } from "@/lib/jobs";
import { Readable } from "stream";
import type { ReadableStream as NodeReadable } from "stream/web";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return Response.json({ error: "Missing id" }, { status: 400 });

  const job = getJob(id);
  if (!job) return Response.json({ error: "Job not found or expired" }, { status: 404 });
  if (job.status === "error") {
    return Response.json({ error: job.error || "Job failed" }, { status: 500 });
  }
  if (job.status !== "done" || !job.outputPath) {
    return Response.json({ error: "Job not finished yet" }, { status: 409 });
  }

  try {
    const stat = await fs.stat(job.outputPath);
    const contentType = job.outputContentType || "application/octet-stream";
    const filename = job.outputName || "download";

    // Stream the file instead of buffering it
    const nodeStream = createReadStream(job.outputPath);
    const webStream = Readable.toWeb(nodeStream) as unknown as NodeReadable<Uint8Array>;

    // Schedule cleanup after a grace period (give the browser time to download)
    setTimeout(() => { cleanupJob(id).catch(() => {}); }, 2 * 60 * 1000);

    return new Response(webStream as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": stat.size.toString(),
        "Cache-Control": "no-store",
        "X-Original-Size": (job.originalSize ?? 0).toString(),
        "X-Compressed-Size": stat.size.toString(),
      },
    });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to read output" },
      { status: 500 }
    );
  }
}
