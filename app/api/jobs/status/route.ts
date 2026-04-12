import type { NextRequest } from "next/server";
import { getJob } from "@/lib/jobs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) {
    return Response.json({ error: "Missing id" }, { status: 400 });
  }

  const job = getJob(id);
  if (!job) {
    return Response.json({ error: "Job not found or expired" }, { status: 404 });
  }

  return Response.json({
    id: job.id,
    status: job.status,
    percent: job.percent,
    stage: job.stage,
    error: job.error,
    originalSize: job.originalSize,
    outputSize: job.outputSize,
    outputName: job.outputName,
  });
}
