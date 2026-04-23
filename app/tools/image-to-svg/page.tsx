"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useDropzone } from "react-dropzone";
import {
  Upload,
  Download,
  Loader2,
  CheckCircle2,
  ImageIcon,
  X,
  Sparkles,
  Minimize2,
  Maximize2,
  Crop,
  Palette,
  Sun,
} from "lucide-react";
import Link from "next/link";

function fmtBytes(n: number) {
  if (n < 1024) return n + " B";
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + " KB";
  return (n / (1024 * 1024)).toFixed(2) + " MB";
}

const STATUS_MESSAGES = [
  "Uploading image...",
  "Analyzing image structure...",
  "Tracing edges and paths...",
  "Building vector shapes...",
  "Optimizing SVG output...",
  "Almost done...",
];

type Stage = "upload" | "converting" | "done";
type Mode = "bw" | "color";

export default function ImageToSvgPage() {
  const [stage, setStage] = useState<Stage>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("color");
  const [threshold, setThreshold] = useState(128);
  const [colors, setColors] = useState(4);
  const [detail, setDetail] = useState(4);
  const [svgData, setSvgData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [statusIdx, setStatusIdx] = useState(0);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const statusRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Animated progress bar + cycling status messages while converting
  useEffect(() => {
    if (stage === "converting") {
      setProgress(0);
      setStatusIdx(0);

      // Progress: ramp to 90% over ~30s, then slow crawl
      progressRef.current = setInterval(() => {
        setProgress((p) => {
          if (p < 60) return p + 2;
          if (p < 85) return p + 0.5;
          if (p < 95) return p + 0.1;
          return p;
        });
      }, 500);

      // Status: cycle messages every 4 seconds
      statusRef.current = setInterval(() => {
        setStatusIdx((i) => (i + 1) % STATUS_MESSAGES.length);
      }, 4000);
    } else {
      if (stage === "done") setProgress(100);
      if (progressRef.current) clearInterval(progressRef.current);
      if (statusRef.current) clearInterval(statusRef.current);
    }
    return () => {
      if (progressRef.current) clearInterval(progressRef.current);
      if (statusRef.current) clearInterval(statusRef.current);
    };
  }, [stage]);

  const onDrop = useCallback(
    (accepted: File[]) => {
      if (accepted.length === 0) return;
      setError(null);
      const f = accepted[0];
      if (f.size > 20 * 1024 * 1024) {
        setError("File exceeds 20 MB limit.");
        return;
      }
      if (preview) URL.revokeObjectURL(preview);
      setFile(f);
      setPreview(URL.createObjectURL(f));
      setSvgData(null);
      setStage("upload");
    },
    [preview]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
      "image/avif": [".avif"],
      "image/gif": [".gif"],
      "image/bmp": [".bmp"],
      "image/tiff": [".tiff", ".tif"],
    },
    maxSize: 20 * 1024 * 1024,
    multiple: false,
  });

  const removeFile = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    setSvgData(null);
    setError(null);
    setStage("upload");
  };

  const convertToSvg = async () => {
    if (!file) return;
    setStage("converting");
    setError(null);
    setSvgData(null);

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("mode", mode);
      fd.append("threshold", String(threshold));
      fd.append("colors", String(colors));
      fd.append("detail", String(detail));

      const res = await fetch("/api/tools/image-to-svg", {
        method: "POST",
        body: fd,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Conversion failed");
        setStage("upload");
        return;
      }

      if (data.svg) {
        setSvgData(data.svg);
        setStage("done");
      } else {
        setError("No SVG returned.");
        setStage("upload");
      }
    } catch {
      setError("Conversion failed. Please try again.");
      setStage("upload");
    }
  };

  const downloadSvg = () => {
    if (!svgData) return;
    const blob = new Blob([svgData], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download =
      (file?.name.replace(/\.[^/.]+$/, "") || "image") + ".svg";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const fullReset = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    setSvgData(null);
    setStage("upload");
    setError(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ─── STAGE 1: Upload ─── */}
      {stage === "upload" && (
        <div className="max-w-4xl mx-auto px-4 py-16">
          {/* Hero */}
          <div className="text-center space-y-3 mb-10">
            <h1 className="text-4xl font-extrabold text-foreground">
              Image to SVG Converter
            </h1>
            <p className="text-muted max-w-lg mx-auto">
              Convert any raster image to scalable SVG vector format. Supports
              black &amp; white tracing and full color vectorization.
            </p>
          </div>

          {/* Drop zone */}
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
                {isDragActive ? "Drop image here" : "Select an image"}
              </p>
              <p className="text-sm text-muted">or drag and drop it here</p>
              <p className="text-xs text-muted mt-3">
                JPG, PNG, WebP, AVIF, GIF, BMP, TIFF. Up to 20 MB.
              </p>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto space-y-4">
              {/* File preview */}
              <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4">
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={preview || ""}
                    alt={file.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-muted mt-0.5">
                    {fmtBytes(file.size)}
                  </p>
                </div>
                <button
                  onClick={removeFile}
                  className="w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors flex-shrink-0"
                >
                  <X size={12} />
                </button>
              </div>

              {/* Options */}
              <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
                {/* Mode */}
                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">
                    Tracing Mode
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setMode("bw")}
                      className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${
                        mode === "bw"
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted hover:border-primary/40"
                      }`}
                    >
                      <Sun size={16} />
                      Black &amp; White
                    </button>
                    <button
                      onClick={() => setMode("color")}
                      className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${
                        mode === "color"
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted hover:border-primary/40"
                      }`}
                    >
                      <Palette size={16} />
                      Color
                    </button>
                  </div>
                </div>

                {/* B&W threshold */}
                {mode === "bw" && (
                  <div>
                    <label className="text-sm font-semibold text-foreground mb-2 flex items-center justify-between">
                      <span>Threshold</span>
                      <span className="text-xs text-muted font-normal">
                        {threshold}
                      </span>
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={255}
                      value={threshold}
                      onChange={(e) => setThreshold(Number(e.target.value))}
                      className="w-full accent-primary"
                    />
                    <div className="flex justify-between text-[10px] text-muted mt-1">
                      <span>More white</span>
                      <span>More black</span>
                    </div>
                  </div>
                )}

                {/* Color count */}
                {mode === "color" && (
                  <div>
                    <label className="text-sm font-semibold text-foreground mb-2 flex items-center justify-between">
                      <span>Number of Colors</span>
                      <span className="text-xs text-muted font-normal">
                        {colors}
                      </span>
                    </label>
                    <input
                      type="range"
                      min={2}
                      max={16}
                      value={colors}
                      onChange={(e) => setColors(Number(e.target.value))}
                      className="w-full accent-primary"
                    />
                    <div className="flex justify-between text-[10px] text-muted mt-1">
                      <span>Simpler (2)</span>
                      <span>Detailed (16)</span>
                    </div>
                  </div>
                )}

                {/* Detail level */}
                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 flex items-center justify-between">
                    <span>Detail Level</span>
                    <span className="text-xs text-muted font-normal">
                      {detail <= 2 ? "High" : detail <= 6 ? "Medium" : "Low"}
                    </span>
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={20}
                    value={detail}
                    onChange={(e) => setDetail(Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                  <div className="flex justify-between text-[10px] text-muted mt-1">
                    <span>More detail</span>
                    <span>Less detail</span>
                  </div>
                </div>
              </div>

              {/* Convert button */}
              <button
                onClick={convertToSvg}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary text-white text-base font-bold rounded-2xl hover:bg-primary-hover transition-colors shadow-lg"
              >
                <ImageIcon size={18} />
                Convert to SVG
              </button>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="max-w-xl mx-auto mt-4 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <ImageIcon size={16} />
              {error}
            </div>
          )}
        </div>
      )}

      {/* ─── STAGE 2: Converting ─── */}
      {stage === "converting" && (
        <div className="max-w-md mx-auto px-4 py-24 text-center space-y-8">
          <Loader2 size={48} className="animate-spin text-primary mx-auto" />
          <div>
            <h2 className="text-xl font-bold text-foreground mb-1">
              Vectorizing your image...
            </h2>
            <p className="text-sm text-muted mb-6">
              {STATUS_MESSAGES[statusIdx]}
            </p>

            {/* Progress bar */}
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-orange-400 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted mt-2">
              {Math.round(progress)}% &middot;{" "}
              {mode === "color"
                ? `Color tracing (${colors} colors)`
                : "Black & white tracing"}
            </p>
          </div>

          <p className="text-[11px] text-muted/60">
            {mode === "color"
              ? "Color mode takes 10-30 seconds depending on image complexity"
              : "Black & white mode is usually faster (5-15 seconds)"}
          </p>
        </div>
      )}

      {/* ─── STAGE 3: Done ─── */}
      {stage === "done" && svgData && (
        <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
          {/* Success */}
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center space-y-2">
            <CheckCircle2 size={40} className="text-green-500 mx-auto" />
            <h2 className="text-xl font-bold text-foreground">
              SVG ready to download
            </h2>
            <p className="text-sm text-green-700">
              Your image has been vectorized as SVG ({fmtBytes(new Blob([svgData]).size)})
            </p>
          </div>

          {/* Before / After */}
          <div>
            <h3 className="text-sm font-bold text-foreground mb-3">
              Before and After
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <span className="text-xs font-semibold text-muted uppercase">
                  Original
                </span>
                <div className="rounded-xl overflow-hidden border border-border bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={preview || ""}
                    alt="Original"
                    className="w-full h-auto"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <span className="text-xs font-semibold text-muted uppercase">
                  SVG Vector
                </span>
                <div
                  className="rounded-xl overflow-hidden border border-border bg-white p-2"
                  dangerouslySetInnerHTML={{ __html: svgData }}
                />
              </div>
            </div>
          </div>

          {/* Download */}
          <button
            onClick={downloadSvg}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary text-white text-base font-bold rounded-2xl hover:bg-primary-hover transition-colors shadow-lg"
          >
            <Download size={18} />
            Download SVG
          </button>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => {
                setSvgData(null);
                setStage("upload");
              }}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-primary border border-primary/30 rounded-xl hover:bg-primary-light transition-colors"
            >
              Adjust Settings
            </button>
            <button
              onClick={fullReset}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-muted border border-border rounded-xl hover:border-primary/40 transition-colors"
            >
              New Image
            </button>
          </div>
        </div>
      )}

      {/* ─── Bottom section ─── */}
      <div className="max-w-3xl mx-auto px-4 pb-12 space-y-8">
        {stage === "upload" && (
          <>
            {/* How it works */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="font-bold text-foreground mb-4">How it works</h2>
              <div className="grid grid-cols-3 gap-4 text-center">
                {[
                  {
                    step: "1",
                    title: "Upload",
                    desc: "Select a JPG, PNG, WebP or other image",
                  },
                  {
                    step: "2",
                    title: "Configure",
                    desc: "Choose B&W or Color and adjust detail",
                  },
                  {
                    step: "3",
                    title: "Download",
                    desc: "Get your scalable SVG vector file",
                  },
                ].map(({ step, title, desc }) => (
                  <div key={step} className="space-y-2">
                    <div className="w-8 h-8 rounded-full bg-primary text-white text-sm font-bold flex items-center justify-center mx-auto">
                      {step}
                    </div>
                    <p className="text-sm font-semibold text-foreground">
                      {title}
                    </p>
                    <p className="text-xs text-muted">{desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Color tracing", sub: "Up to 16 color layers" },
                { label: "B&W tracing", sub: "Adjustable threshold" },
                { label: "No sign-up", sub: "Free forever" },
                { label: "Files never stored", sub: "100% private" },
              ].map(({ label, sub }) => (
                <div
                  key={label}
                  className="bg-card border border-border rounded-xl p-3 text-center"
                >
                  <p className="text-xs font-bold text-foreground">{label}</p>
                  <p className="text-[10px] text-muted">{sub}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Related Tools */}
        <div>
          <h3 className="text-sm font-bold text-muted uppercase tracking-wider mb-3">
            Related Tools
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                href: "/tools/remove-background",
                icon: Sparkles,
                label: "Remove Background",
              },
              {
                href: "/tools/resize",
                icon: Maximize2,
                label: "Resize Image",
              },
              {
                href: "/tools/compress",
                icon: Minimize2,
                label: "Compress Image",
              },
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
      </div>
    </div>
  );
}
