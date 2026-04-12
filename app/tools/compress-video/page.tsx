"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useDropzone } from "react-dropzone";
import {
  Video, Upload, Download, X, CheckCircle2,
  Minimize2, Film, Maximize2, Wand2, ImageIcon, Clock,
} from "lucide-react";
import Link from "next/link";

interface Result {
  name: string;
  originalSize: number;
  compressedSize: number;
  url: string;
  contentType: string;
}

type Quality = "low" | "medium" | "high" | "extreme";
type Format = "mp4" | "webm";
type Stage = "upload" | "compressing" | "done";

const QUALITY_OPTIONS: { value: Quality; label: string; desc: string }[] = [
  { value: "low",     label: "Light",    desc: "Near original" },
  { value: "medium",  label: "Balanced", desc: "Recommended" },
  { value: "high",    label: "Strong",   desc: "Smaller file" },
  { value: "extreme", label: "Extreme",  desc: "Smallest" },
];

function fmtBytes(n: number) {
  if (n < 1024) return n + " B";
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + " KB";
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(2) + " MB";
  return (n / (1024 * 1024 * 1024)).toFixed(2) + " GB";
}

function fmtEta(seconds: number) {
  if (!isFinite(seconds) || seconds <= 0) return "calculating…";
  if (seconds < 60) return `${Math.ceil(seconds)}s remaining`;
  const m = Math.floor(seconds / 60);
  const s = Math.ceil(seconds % 60);
  return `${m}m ${s}s remaining`;
}

export default function CompressVideoPage() {
  const [stage, setStage] = useState<Stage>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [quality, setQuality] = useState<Quality>("medium");
  const [format, setFormat] = useState<Format>("mp4");

  const [uploadPct, setUploadPct] = useState(0);
  const [encodePct, setEncodePct] = useState(0);
  const [stageText, setStageText] = useState("Preparing…");
  const [phase, setPhase] = useState<"upload" | "encode" | "download">("upload");

  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  const encodeStartRef = useRef<number>(0);
  const pollRef = useRef<number | null>(null);

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted.length === 0) return;
    setError(null);
    const f = accepted[0];
    setFile(f);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(f));
  }, [preview]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "video/*": [] },
    maxSize: 500 * 1024 * 1024,
    multiple: false,
  });

  const clearFile = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    setError(null);
  };

  useEffect(() => {
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, []);

  // Upload with XHR so we get a real upload progress %
  function uploadWithProgress(
    url: string,
    fd: FormData,
    onProgress: (pct: number) => void
  ): Promise<{ jobId?: string; error?: string }> {
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", url);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress((e.loaded / e.total) * 100);
      };
      xhr.onload = () => {
        try {
          const data = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) resolve(data);
          else resolve({ error: data.error || `HTTP ${xhr.status}` });
        } catch {
          resolve({ error: `HTTP ${xhr.status}` });
        }
      };
      xhr.onerror = () => resolve({ error: "Network error" });
      xhr.send(fd);
    });
  }

  const compress = async () => {
    if (!file) return;
    setStage("compressing");
    setError(null);
    setResult(null);
    setUploadPct(0);
    setEncodePct(0);
    setPhase("upload");
    setStageText("Uploading video…");

    const fd = new FormData();
    fd.append("file", file);
    fd.append("quality", quality);
    fd.append("format", format);

    // ─── Upload ──────────────────────────────────────────────────
    const res = await uploadWithProgress("/api/tools/compress-video", fd, (pct) => {
      setUploadPct(pct);
    });

    if (res.error || !res.jobId) {
      setError(res.error || "Upload failed");
      setStage("upload");
      return;
    }

    setUploadPct(100);
    setPhase("encode");
    setStageText("Compressing video…");
    encodeStartRef.current = Date.now();

    // ─── Poll job status ─────────────────────────────────────────
    const jobId = res.jobId;
    pollRef.current = window.setInterval(async () => {
      try {
        const r = await fetch(`/api/jobs/status?id=${jobId}`);
        if (!r.ok) {
          const data = await r.json().catch(() => ({ error: "Status check failed" }));
          throw new Error(data.error || `HTTP ${r.status}`);
        }
        const data = await r.json();

        if (typeof data.percent === "number") setEncodePct(data.percent);
        if (data.stage) setStageText(data.stage);

        if (data.status === "done") {
          if (pollRef.current) {
            window.clearInterval(pollRef.current);
            pollRef.current = null;
          }
          setPhase("download");
          setStageText("Downloading compressed video…");

          // Fetch the file
          const fileRes = await fetch(`/api/jobs/result?id=${jobId}`);
          if (!fileRes.ok) {
            const data2 = await fileRes.json().catch(() => ({ error: "Download failed" }));
            setError(data2.error || "Download failed");
            setStage("upload");
            return;
          }

          const blob = await fileRes.blob();
          const origSize = parseInt(fileRes.headers.get("X-Original-Size") || "0") || (file?.size ?? 0);
          const compSize = parseInt(fileRes.headers.get("X-Compressed-Size") || "0") || blob.size;
          const disp = fileRes.headers.get("Content-Disposition") || "";
          const match = disp.match(/filename="(.+?)"/);
          const name = match?.[1] || `compressed.${format}`;
          const contentType = fileRes.headers.get("Content-Type") || `video/${format}`;

          setResult({
            name,
            originalSize: origSize,
            compressedSize: compSize,
            url: URL.createObjectURL(blob),
            contentType,
          });
          setStage("done");
        } else if (data.status === "error") {
          if (pollRef.current) {
            window.clearInterval(pollRef.current);
            pollRef.current = null;
          }
          setError(data.error || "Compression failed");
          setStage("upload");
        }
      } catch (err) {
        if (pollRef.current) {
          window.clearInterval(pollRef.current);
          pollRef.current = null;
        }
        setError(err instanceof Error ? err.message : "Status check failed");
        setStage("upload");
      }
    }, 800);
  };

  const reset = () => {
    if (preview) URL.revokeObjectURL(preview);
    if (result) URL.revokeObjectURL(result.url);
    if (pollRef.current) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
    setFile(null);
    setPreview(null);
    setResult(null);
    setStage("upload");
    setError(null);
    setUploadPct(0);
    setEncodePct(0);
  };

  const saved = result ? result.originalSize - result.compressedSize : 0;
  const pct = result && result.originalSize > 0
    ? ((saved / result.originalSize) * 100).toFixed(0)
    : "0";

  // Overall progress = 10% upload + 85% encoding + 5% download
  const overallPct =
    phase === "upload"
      ? Math.round(uploadPct * 0.1)
      : phase === "encode"
      ? Math.round(10 + encodePct * 0.85)
      : 98;

  // Rough ETA for encode phase based on speed so far
  let etaText = "";
  if (phase === "encode" && encodePct > 2) {
    const elapsed = (Date.now() - encodeStartRef.current) / 1000;
    const total = elapsed / (encodePct / 100);
    etaText = fmtEta(total - elapsed);
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ─── STAGE 1: Upload ─── */}
      {stage === "upload" && (
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="text-center space-y-3 mb-10">
            <h1 className="text-4xl font-extrabold text-foreground">Compress Video</h1>
            <p className="text-muted max-w-xl mx-auto">
              Reduce the file size of MP4, MOV, AVI, WEBM and MKV videos up to 90% smaller. Free, no signup, no watermark.
            </p>
          </div>

          {!file ? (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-3xl p-16 text-center cursor-pointer transition-all max-w-xl mx-auto ${
                isDragActive
                  ? "border-primary bg-primary-light"
                  : "border-border hover:border-primary/60 hover:bg-primary-light/30"
              }`}
            >
              <input {...getInputProps()} />
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Upload size={28} className="text-primary" />
              </div>
              <p className="font-bold text-foreground text-lg mb-1">
                {isDragActive ? "Drop video here" : "Select a video"}
              </p>
              <p className="text-sm text-muted">or drag and drop it here</p>
              <p className="text-xs text-muted mt-3">MP4, MOV, AVI, WEBM, MKV. Up to 500 MB.</p>
            </div>
          ) : (
            <div className="max-w-xl mx-auto space-y-6">
              <div className="relative bg-black rounded-2xl overflow-hidden border border-border">
                {preview && (
                  // eslint-disable-next-line jsx-a11y/media-has-caption
                  <video src={preview} controls className="w-full max-h-[360px] object-contain" />
                )}
                <button
                  onClick={clearFile}
                  className="absolute top-3 right-3 w-8 h-8 bg-black/70 text-white rounded-full flex items-center justify-center hover:bg-black/90 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Film size={18} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{file.name}</p>
                  <p className="text-xs text-muted">{fmtBytes(file.size)}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-muted uppercase tracking-wider mb-2">Compression Level</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {QUALITY_OPTIONS.map(({ value, label, desc }) => (
                    <button
                      key={value}
                      onClick={() => setQuality(value)}
                      className={`rounded-xl border-2 p-3 text-left transition-all ${
                        quality === value
                          ? "border-primary bg-primary-light"
                          : "border-border hover:border-primary/40"
                      }`}
                    >
                      <p className={`text-sm font-bold ${quality === value ? "text-primary" : "text-foreground"}`}>{label}</p>
                      <p className="text-[10px] text-muted leading-tight mt-0.5">{desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-muted uppercase tracking-wider mb-2">Output Format</p>
                <div className="grid grid-cols-2 gap-2">
                  {(["mp4", "webm"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFormat(f)}
                      className={`rounded-xl border-2 p-3 text-center transition-all ${
                        format === f
                          ? "border-primary bg-primary-light"
                          : "border-border hover:border-primary/40"
                      }`}
                    >
                      <p className={`text-sm font-bold uppercase ${format === f ? "text-primary" : "text-foreground"}`}>{f}</p>
                      <p className="text-[10px] text-muted">
                        {f === "mp4" ? "Best compatibility" : "Best compression"}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={compress}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary text-white text-base font-bold rounded-2xl hover:bg-primary-hover transition-colors shadow-lg"
              >
                <Minimize2 size={18} />
                Compress Video
              </button>
            </div>
          )}

          {error && (
            <div className="max-w-xl mx-auto mt-4 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <ImageIcon size={16} />
              {error}
            </div>
          )}
        </div>
      )}

      {/* ─── STAGE 2: Compressing — rich progress ─── */}
      {stage === "compressing" && (
        <div className="max-w-xl mx-auto px-4 py-16 space-y-8">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 bg-primary-light text-primary text-xs font-bold px-3 py-1 rounded-full">
              <Film size={12} />
              {phase === "upload" && "Step 1 of 3"}
              {phase === "encode" && "Step 2 of 3"}
              {phase === "download" && "Step 3 of 3"}
            </div>
            <h2 className="text-2xl font-extrabold text-foreground">{stageText}</h2>
            {etaText && (
              <p className="flex items-center justify-center gap-1.5 text-sm text-muted">
                <Clock size={13} />
                {etaText}
              </p>
            )}
          </div>

          {/* Big circular progress */}
          <div className="relative w-48 h-48 mx-auto">
            <svg className="w-48 h-48 -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-gray-100"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 45}`}
                strokeDashoffset={`${2 * Math.PI * 45 * (1 - overallPct / 100)}`}
                className="text-primary transition-all duration-300"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-4xl font-extrabold text-foreground tabular-nums">{overallPct}%</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted">complete</p>
            </div>
          </div>

          {/* Phase breakdown */}
          <div className="space-y-3">
            <PhaseRow
              label="Upload"
              pct={uploadPct}
              active={phase === "upload"}
              done={phase !== "upload"}
            />
            <PhaseRow
              label="Compress"
              pct={encodePct}
              active={phase === "encode"}
              done={phase === "download"}
            />
            <PhaseRow
              label="Download"
              pct={phase === "download" ? 50 : 0}
              active={phase === "download"}
              done={false}
            />
          </div>

          <p className="text-xs text-muted text-center px-4">
            Keep this tab open. Larger videos and higher-quality settings take longer.
          </p>
        </div>
      )}

      {/* ─── STAGE 3: Result ─── */}
      {stage === "done" && result && (
        <div className="max-w-2xl mx-auto px-4 py-12 space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center space-y-2">
            <CheckCircle2 size={40} className="text-green-500 mx-auto" />
            <h2 className="text-xl font-bold text-foreground">Video compressed</h2>
            <p className="text-sm text-green-700">
              Saved {fmtBytes(saved)} ({pct}% smaller)
            </p>
            <p className="text-xs text-muted">
              {fmtBytes(result.originalSize)} → {fmtBytes(result.compressedSize)}
            </p>
          </div>

          <div className="bg-black rounded-2xl overflow-hidden border border-border">
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video src={result.url} controls className="w-full max-h-[360px] object-contain" />
          </div>

          <a
            href={result.url}
            download={result.name}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary text-white text-base font-bold rounded-2xl hover:bg-primary-hover transition-colors shadow-lg"
          >
            <Download size={18} />
            Download Compressed Video
          </a>

          <button
            onClick={reset}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-muted border border-border rounded-xl hover:border-primary/40 transition-colors"
          >
            Compress Another Video
          </button>
        </div>
      )}

      {/* ─── Bottom SEO sections ─── */}
      <div className="max-w-3xl mx-auto px-4 pb-12 space-y-8">
        {stage === "upload" && (
          <>
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="font-bold text-foreground mb-4">How it works</h2>
              <div className="grid grid-cols-3 gap-4 text-center">
                {[
                  { step: "1", title: "Upload", desc: "Select any MP4, MOV, AVI, WEBM or MKV video" },
                  { step: "2", title: "Compress", desc: "Choose quality level and tap Compress" },
                  { step: "3", title: "Download", desc: "Save your shrunken video file" },
                ].map(({ step, title, desc }) => (
                  <div key={step} className="space-y-2">
                    <div className="w-8 h-8 rounded-full bg-primary text-white text-sm font-bold flex items-center justify-center mx-auto">
                      {step}
                    </div>
                    <p className="text-sm font-semibold text-foreground">{title}</p>
                    <p className="text-xs text-muted">{desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "MP4, MOV, AVI, WEBM", sub: "All formats" },
                { label: "Up to 500 MB", sub: "Large videos" },
                { label: "No watermark", sub: "Clean output" },
                { label: "Files never stored", sub: "100% private" },
              ].map(({ label, sub }) => (
                <div key={label} className="bg-card border border-border rounded-xl p-3 text-center">
                  <p className="text-xs font-bold text-foreground">{label}</p>
                  <p className="text-[10px] text-muted">{sub}</p>
                </div>
              ))}
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
              <h2 className="text-lg font-bold text-foreground">Free online video compressor</h2>
              <p className="text-sm text-muted leading-relaxed">
                Our free video compressor reduces the file size of MP4, MOV, AVI, WEBM and MKV videos
                without visibly losing quality. Perfect for sharing videos on WhatsApp, email, Discord,
                Slack, or uploading faster to YouTube, TikTok, Instagram and Twitter. No sign-up, no
                watermark, and your files are never stored on our servers.
              </p>

              <h3 className="text-base font-bold text-foreground pt-2">Why compress video online?</h3>
              <ul className="text-sm text-muted space-y-1.5 list-disc pl-5">
                <li>Email attachment limits (Gmail: 25 MB, Outlook: 20 MB)</li>
                <li>WhatsApp video sharing (16 MB limit)</li>
                <li>Faster upload times for social media</li>
                <li>Save storage space on your phone or computer</li>
                <li>Faster page loads for videos embedded on websites</li>
              </ul>

              <h3 className="text-base font-bold text-foreground pt-2">How does it work?</h3>
              <p className="text-sm text-muted leading-relaxed">
                We use industry-standard H.264 (for MP4) and VP9 (for WEBM) codecs with variable bitrate
                encoding. You pick a compression level — Light, Balanced, Strong, or Extreme — and we
                re-encode your video for maximum size reduction at that quality tier. Most videos shrink
                by 50-90% without noticeable quality loss.
              </p>

              <h3 className="text-base font-bold text-foreground pt-2">Is it really free?</h3>
              <p className="text-sm text-muted leading-relaxed">
                Yes. LoveConverts Video Compressor is 100% free with no watermark and no account
                required. Anonymous users can compress videos up to 50 MB. Sign up free to compress
                videos up to 100 MB, or upgrade to Pro for videos up to 500 MB.
              </p>
            </div>
          </>
        )}

        <div>
          <h3 className="text-sm font-bold text-muted uppercase tracking-wider mb-3">Related Tools</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { href: "/tools/compress", icon: Minimize2, label: "Compress Image" },
              { href: "/tools/resize", icon: Maximize2, label: "Resize Image" },
              { href: "/tools/photo-editor", icon: Wand2, label: "Photo Editor" },
            ].map(({ href, icon: Icon, label }) => (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center gap-2 p-3 rounded-xl border border-border hover:border-primary/30 hover:shadow-sm transition-all text-center group"
              >
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Icon size={16} className="text-primary" />
                </div>
                <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                  {label}
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div className="sr-only">
          <Video aria-hidden="true" />
          video compressor online free, compress mp4, compress mov, reduce video size, shrink video file, video size reducer, compress video for email, compress video for whatsapp
        </div>
      </div>
    </div>
  );
}

function PhaseRow({
  label,
  pct,
  active,
  done,
}: {
  label: string;
  pct: number;
  active: boolean;
  done: boolean;
}) {
  const display = done ? 100 : Math.round(pct);
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <p
          className={`text-xs font-bold uppercase tracking-wider ${
            active ? "text-primary" : done ? "text-green-600" : "text-muted"
          }`}
        >
          {done && <CheckCircle2 size={12} className="inline mr-1 -mt-0.5" />}
          {label}
        </p>
        <p className={`text-xs font-bold tabular-nums ${active ? "text-primary" : "text-muted"}`}>
          {display}%
        </p>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${
            done ? "bg-green-500" : active ? "bg-primary" : "bg-gray-300"
          }`}
          style={{ width: `${display}%` }}
        />
      </div>
    </div>
  );
}
