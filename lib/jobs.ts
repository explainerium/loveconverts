/**
 * In-memory job store for long-running async tasks with progress tracking.
 *
 * Used by video compression, video downloads, and any other server-side
 * task that takes more than a second and benefits from a real progress bar.
 *
 * NOTE: This is single-process memory. With pm2 cluster mode this would
 * break — assumes the loveconverts process runs as a single instance.
 */

import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { randomUUID } from "crypto";

export type JobStatus = "queued" | "running" | "done" | "error";

export interface Job {
  id: string;
  status: JobStatus;
  percent: number;           // 0 – 100
  stage: string;             // human-readable, e.g. "Compressing video", "Downloading"
  error?: string;
  outputPath?: string;       // absolute path to finished file
  outputName?: string;       // suggested download filename
  outputContentType?: string;
  originalSize?: number;     // input bytes (if known)
  outputSize?: number;       // output bytes (once done)
  createdAt: number;
  updatedAt: number;
  tempPaths: string[];       // files to delete on cleanup
}

const jobs = new Map<string, Job>();

const JOB_TTL_MS = 15 * 60 * 1000; // 15 minutes
const CLEANUP_INTERVAL_MS = 60 * 1000;

// Base temp dir for job files
const JOBS_DIR = path.join(os.tmpdir(), "lc-jobs");

export async function ensureJobsDir(): Promise<string> {
  await fs.mkdir(JOBS_DIR, { recursive: true });
  return JOBS_DIR;
}

export function createJob(stage: string): Job {
  const id = randomUUID();
  const job: Job = {
    id,
    status: "queued",
    percent: 0,
    stage,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    tempPaths: [],
  };
  jobs.set(id, job);
  return job;
}

export function getJob(id: string): Job | undefined {
  return jobs.get(id);
}

export function updateJob(id: string, patch: Partial<Job>): Job | undefined {
  const job = jobs.get(id);
  if (!job) return undefined;
  Object.assign(job, patch, { updatedAt: Date.now() });
  return job;
}

export function setJobPercent(id: string, percent: number, stage?: string) {
  const job = jobs.get(id);
  if (!job) return;
  // Only allow monotonic upward progress to prevent UI flicker
  const clamped = Math.min(100, Math.max(0, Math.round(percent)));
  if (clamped > job.percent || clamped === 100) {
    job.percent = clamped;
  }
  if (stage) job.stage = stage;
  job.status = "running";
  job.updatedAt = Date.now();
}

export function completeJob(
  id: string,
  outputPath: string,
  outputName: string,
  outputContentType: string,
  outputSize: number
) {
  const job = jobs.get(id);
  if (!job) return;
  job.status = "done";
  job.percent = 100;
  job.outputPath = outputPath;
  job.outputName = outputName;
  job.outputContentType = outputContentType;
  job.outputSize = outputSize;
  job.updatedAt = Date.now();
  if (!job.tempPaths.includes(outputPath)) job.tempPaths.push(outputPath);
}

export function failJob(id: string, error: string) {
  const job = jobs.get(id);
  if (!job) return;
  job.status = "error";
  job.error = error;
  job.updatedAt = Date.now();
}

export async function cleanupJob(id: string) {
  const job = jobs.get(id);
  if (!job) return;
  await Promise.all(
    job.tempPaths.map((p) => fs.unlink(p).catch(() => {}))
  );
  jobs.delete(id);
}

/**
 * Background sweeper — removes jobs older than JOB_TTL_MS and their temp files.
 * Runs once per minute. Idempotent; only installed once per process.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cleanupTimer: any = null;
export function installCleanupTimer() {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(async () => {
    const now = Date.now();
    const expired: string[] = [];
    for (const [id, job] of jobs) {
      if (now - job.updatedAt > JOB_TTL_MS) expired.push(id);
    }
    for (const id of expired) {
      await cleanupJob(id).catch(() => {});
    }
  }, CLEANUP_INTERVAL_MS);
  // Do not block Node exit
  if (cleanupTimer.unref) cleanupTimer.unref();
}

installCleanupTimer();
