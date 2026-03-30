"use client";

import { useState, useCallback, useRef } from "react";
import { useDropzone } from "react-dropzone";
import {
  Eraser,
  Upload,
  Download,
  X,
  AlertCircle,
  Loader2,
  Zap,
  Minimize2,
  Maximize2,
  Crop,
} from "lucide-react";
import Link from "next/link";
import UpgradeModal from "@/app/components/UpgradeModal";

function fmtBytes(n: number) {
  if (n < 1024) return n + " B";
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + " KB";
  return (n / (1024 * 1024)).toFixed(2) + " MB";
}

export default function RemoveBackgroundPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [threshold, setThreshold] = useState(50);
  const [bgMode, setBgMode] = useState<"transparent" | "color">("transparent");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const onDrop = useCallback((accepted: File[]) => {
    setError(null);
    setResultUrl(null);
    if (accepted.length === 0) return;
    const f = accepted[0];
    if (f.size > 20 * 1024 * 1024) {
      setError("File exceeds 20 MB limit.");
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
    },
    maxSize: 20 * 1024 * 1024,
    multiple: false,
  });

  const clearFile = () => {
    if (preview) URL.revokeObjectURL(preview);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setFile(null);
    setPreview(null);
    setResultUrl(null);
    setError(null);
  };

  const removeBackground = async () => {
    if (!file) return;
    setProcessing(true);
    setError(null);
    setResultUrl(null);

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("threshold", String(threshold));
      if (bgMode === "color") {
        fd.append("bgColor", bgColor);
      }

      abortRef.current = new AbortController();
      const res = await fetch("/api/tools/remove-background", {
        method: "POST",
        body: fd,
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const data = await res.json();
        if (data.code === "RATE_LIMIT") {
          setShowUpgrade(true);
          return;
        }
        setError(data.error || "Background removal failed");
        return;
      }

      const blob = await res.blob();
      setResultUrl(URL.createObjectURL(blob));
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setError("Background removal failed. Please try again.");
      }
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-10">
      <div className="max-w-3xl mx-auto px-4 space-y-8">
        {/* Hero */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 bg-primary-light text-primary text-xs font-bold px-3 py-1 rounded-full mb-2">
            <Eraser size={12} /> REMOVE BACKGROUND
          </div>
          <h1 className="text-3xl font-extrabold text-foreground">
            Remove Image Background
          </h1>
          <p className="text-muted max-w-md mx-auto text-sm">
            Remove backgrounds from images and get a transparent PNG. Fast,
            free, no signup required.
          </p>
        </div>

        {/* Controls */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
          {/* Threshold */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-foreground">
                Sensitivity
              </span>
              <span className="text-sm font-bold text-primary">
                {threshold}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="custom-range w-full"
            />
            <div className="flex justify-between text-[10px] text-muted mt-1">
              <span>Precise</span>
              <span>Aggressive</span>
            </div>
          </div>

          {/* Background mode */}
          <div>
            <span className="text-sm font-semibold text-foreground mb-2 block">
              Background
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setBgMode("transparent")}
                className={`p-2 rounded-xl border text-center transition-all ${
                  bgMode === "transparent"
                    ? "border-primary bg-primary-light"
                    : "border-border hover:border-primary/40"
                }`}
              >
                <div
                  className={`text-xs font-bold ${
                    bgMode === "transparent"
                      ? "text-primary"
                      : "text-foreground"
                  }`}
                >
                  Transparent
                </div>
                <div className="text-[10px] text-muted">PNG with alpha</div>
              </button>
              <button
                onClick={() => setBgMode("color")}
                className={`p-2 rounded-xl border text-center transition-all ${
                  bgMode === "color"
                    ? "border-primary bg-primary-light"
                    : "border-border hover:border-primary/40"
                }`}
              >
                <div
                  className={`text-xs font-bold ${
                    bgMode === "color" ? "text-primary" : "text-foreground"
                  }`}
                >
                  Custom Color
                </div>
                <div className="text-[10px] text-muted">Choose a color</div>
              </button>
            </div>
            {bgMode === "color" && (
              <div className="mt-3 flex items-center gap-3">
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-10 h-10 rounded-lg border border-border cursor-pointer"
                />
                <span className="text-xs text-muted">
                  {bgColor.toUpperCase()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Drop zone (show when no file is selected) */}
        {!file && (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
              isDragActive
                ? "border-primary bg-primary-light"
                : "border-border hover:border-primary/60 hover:bg-primary-light/30"
            }`}
          >
            <input {...getInputProps()} />
            <Upload
              size={32}
              className={`mx-auto mb-3 ${
                isDragActive ? "text-primary" : "text-muted"
              }`}
            />
            <p className="font-semibold text-foreground">
              {isDragActive
                ? "Drop image here"
                : "Drag & drop an image or click to browse"}
            </p>
            <p className="text-xs text-muted mt-1">
              JPG, PNG, WEBP · Max 20 MB
            </p>
          </div>
        )}

        {/* File selected */}
        {file && !resultUrl && (
          <div className="space-y-4">
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
                onClick={clearFile}
                className="p-1.5 text-muted hover:text-red-500 transition-colors flex-shrink-0"
              >
                <X size={14} />
              </button>
            </div>

            <button
              onClick={removeBackground}
              disabled={processing}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Removing Background...
                </>
              ) : (
                <>
                  <Eraser size={16} />
                  Remove Background
                </>
              )}
            </button>
          </div>
        )}

        {/* Result: before / after */}
        {resultUrl && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-foreground">
              Before & After
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {/* Original */}
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
              {/* Result */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-muted uppercase">
                  Result
                </span>
                <div
                  className="rounded-xl overflow-hidden border border-border"
                  style={{
                    backgroundImage:
                      "repeating-conic-gradient(#d4d4d4 0% 25%, #fff 0% 50%)",
                    backgroundSize: "16px 16px",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={resultUrl}
                    alt="Background removed"
                    className="w-full h-auto"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <a
                href={resultUrl}
                download={
                  (file?.name.replace(/\.[^/.]+$/, "") || "image") +
                  "-no-bg.png"
                }
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary-hover transition-colors"
              >
                <Download size={16} /> Download PNG
              </a>
              <button
                onClick={clearFile}
                className="px-4 py-3 text-sm font-bold text-muted border border-border rounded-xl hover:border-primary/40 transition-colors"
              >
                Try Another
              </button>
            </div>
          </div>
        )}

        {/* Processing */}
        {processing && (
          <div className="flex items-center gap-2 text-sm text-muted">
            <Loader2 size={16} className="animate-spin text-primary" />
            Processing your image...
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Info */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-primary" />
            <h3 className="text-sm font-bold text-foreground">
              How background removal works
            </h3>
          </div>
          <p className="text-sm text-muted leading-relaxed">
            We sample the corner pixels of your image to detect the background
            color, then make all similar pixels transparent using the sensitivity
            threshold you set. This works best with solid-color backgrounds
            (white, green screen, etc). Adjust the sensitivity slider for better
            results. Files are processed on our server and never stored.
          </p>
        </div>

        {/* Related Tools */}
        <div>
          <h3 className="text-sm font-bold text-muted uppercase tracking-wider mb-3">
            Related Tools
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                href: "/tools/compress",
                icon: Minimize2,
                label: "Compress Image",
              },
              {
                href: "/tools/resize",
                icon: Maximize2,
                label: "Resize Image",
              },
              { href: "/tools/crop", icon: Crop, label: "Crop Image" },
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

      <UpgradeModal
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
      />
    </div>
  );
}
