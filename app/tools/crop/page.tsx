"use client";

import { useState, useCallback, useRef } from "react";
import { useDropzone } from "react-dropzone";
import ReactCrop, {
  type Crop,
  type PixelCrop,
  centerCrop,
  makeAspectCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import {
  Crop as CropIcon,
  Upload,
  Download,
  Loader2,
  CheckCircle2,
  Minimize2,
  Maximize2,
  Wand2,
} from "lucide-react";
import Link from "next/link";
import UpgradeModal from "@/app/components/UpgradeModal";
import { useToolShortcuts } from "@/app/components/useToolShortcuts";
import KeyboardShortcuts from "@/app/components/KeyboardShortcuts";

/* ── helpers ─────────────────────────────────────────────── */

function fmtBytes(n: number) {
  if (n < 1024) return n + " B";
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + " KB";
  return (n / (1024 * 1024)).toFixed(2) + " MB";
}

const ASPECT_PRESETS: { label: string; value: number | undefined }[] = [
  { label: "Free", value: undefined },
  { label: "1:1", value: 1 },
  { label: "4:3", value: 4 / 3 },
  { label: "16:9", value: 16 / 9 },
  { label: "3:2", value: 3 / 2 },
];

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
): Crop {
  return centerCrop(
    makeAspectCrop({ unit: "%", width: 90 }, aspect, mediaWidth, mediaHeight),
    mediaWidth,
    mediaHeight,
  );
}

/* ── types ───────────────────────────────────────────────── */

type Stage = "upload" | "cropping" | "done";

/* ── component ───────────────────────────────────────────── */

export default function CropPage() {
  const [stage, setStage] = useState<Stage>("upload");

  // file state
  const [file, setFile] = useState<File | null>(null);
  const [imgSrc, setImgSrc] = useState("");
  const [fileName, setFileName] = useState("");

  // crop state
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [aspect, setAspect] = useState<number | undefined>(undefined);
  const imgRef = useRef<HTMLImageElement>(null);

  // result state
  const [resultUrl, setResultUrl] = useState("");
  const [resultName, setResultName] = useState("");
  const [originalSize, setOriginalSize] = useState(0);
  const [croppedSize, setCroppedSize] = useState(0);

  // UI state
  const [error, setError] = useState<string | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);

  /* ── file handling ───────────────────────────────────── */

  const onDrop = useCallback((accepted: File[]) => {
    const f = accepted[0];
    if (!f) return;
    setError(null);
    setFile(f);
    setFileName(f.name.replace(/\.[^.]+$/, ""));
    setOriginalSize(f.size);
    setResultUrl("");
    const reader = new FileReader();
    reader.onload = () => setImgSrc(reader.result as string);
    reader.readAsDataURL(f);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    maxSize: 20 * 1024 * 1024,
    multiple: false,
  });

  /* ── image + aspect ──────────────────────────────────── */

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
    const initial = aspect
      ? centerAspectCrop(w, h, aspect)
      : centerCrop({ unit: "%", width: 80, height: 80 }, w, h);
    setCrop(initial);
  };

  const changeAspect = (a: number | undefined) => {
    setAspect(a);
    if (imgRef.current && a !== undefined) {
      const { naturalWidth: w, naturalHeight: h } = imgRef.current;
      setCrop(centerAspectCrop(w, h, a));
    }
  };

  /* ── crop action ─────────────────────────────────────── */

  const handleCrop = async () => {
    if (!completedCrop || !file) return;
    setStage("cropping");
    setError(null);

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("left", String(Math.round(completedCrop.x)));
      fd.append("top", String(Math.round(completedCrop.y)));
      fd.append("width", String(Math.round(completedCrop.width)));
      fd.append("height", String(Math.round(completedCrop.height)));

      const res = await fetch("/api/tools/crop", { method: "POST", body: fd });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Crop failed" }));
        if (data.code === "RATE_LIMIT") {
          setShowUpgrade(true);
          setStage("upload");
          return;
        }
        setError(data.error || "Crop failed");
        setStage("upload");
        return;
      }

      const blob = await res.blob();
      const ext = file.name.split(".").pop() || "jpg";
      const croppedName = `${fileName}-cropped.${ext}`;

      setResultUrl(URL.createObjectURL(blob));
      setResultName(croppedName);
      setCroppedSize(blob.size);
      setStage("done");
    } catch {
      setError("Crop failed. Please try again.");
      setStage("upload");
    }
  };

  /* ── reset ───────────────────────────────────────────── */

  const reset = () => {
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setFile(null);
    setImgSrc("");
    setFileName("");
    setCrop(undefined);
    setCompletedCrop(undefined);
    setAspect(undefined);
    setResultUrl("");
    setResultName("");
    setOriginalSize(0);
    setCroppedSize(0);
    setStage("upload");
    setError(null);
  };

  const handlePastedFile = useCallback((file: File) => {
    setError(null);
    setFile(file);
    setFileName(file.name.replace(/\.[^.]+$/, ""));
    setOriginalSize(file.size);
    setResultUrl("");
    const reader = new FileReader();
    reader.onload = () => setImgSrc(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  useToolShortcuts({
    onPaste: handlePastedFile,
    onReset: () => reset(),
    onAction: () => handleCrop(),
    onDownload: () => {
      if (resultUrl) {
        const a = document.createElement("a");
        a.href = resultUrl;
        a.download = resultName;
        a.click();
      }
    },
    canAct: !!completedCrop && !!file && stage === "upload",
    canDownload: stage === "done" && !!resultUrl,
  });

  /* ── render ──────────────────────────────────────────── */

  return (
    <div className="min-h-screen bg-background">
      {/* ─── STAGE 1: Upload + Crop Editor ─── */}
      {stage === "upload" && (
        <div className="max-w-4xl mx-auto px-4 py-16">
          {/* Hero */}
          <div className="text-center space-y-3 mb-10">
            <h1 className="text-4xl font-extrabold text-foreground">
              Crop Images
            </h1>
            <p className="text-muted max-w-lg mx-auto">
              Trim and crop images to any size. Select a region and download the
              result instantly.
            </p>
          </div>

          {/* Drop zone (no file selected yet) */}
          {!imgSrc && (
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
                JPG, PNG, WEBP, GIF. Up to 20 MB.
              </p>
              <p className="text-[11px] text-muted/60 mt-2">You can also paste an image directly with Ctrl+V / Cmd+V</p>
            </div>
          )}

          {/* Crop editor (file selected) */}
          {imgSrc && (
            <div className="max-w-2xl mx-auto space-y-4">
              {/* Aspect ratio presets */}
              <div className="bg-card border border-border rounded-2xl p-4">
                <p className="text-xs font-bold text-muted uppercase tracking-wider mb-3">
                  Aspect Ratio
                </p>
                <div className="flex flex-wrap gap-2">
                  {ASPECT_PRESETS.map((p) => (
                    <button
                      key={p.label}
                      onClick={() => changeAspect(p.value)}
                      className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                        aspect === p.value
                          ? "bg-primary text-white"
                          : "bg-gray-100 text-muted hover:bg-gray-200 hover:text-foreground"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Crop canvas */}
              <div className="bg-card border border-border rounded-2xl p-4 overflow-hidden">
                <ReactCrop
                  crop={crop}
                  onChange={(c) => setCrop(c)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={aspect}
                  className="max-w-full"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    ref={imgRef}
                    src={imgSrc}
                    alt="Crop preview"
                    onLoad={onImageLoad}
                    className="max-w-full max-h-[500px] object-contain"
                  />
                </ReactCrop>
              </div>

              {/* Pixel dimensions info */}
              {completedCrop && (
                <p className="text-xs text-muted text-center">
                  Selection: {Math.round(completedCrop.width)} x{" "}
                  {Math.round(completedCrop.height)} px
                </p>
              )}

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <CropIcon size={16} />
                  {error}
                </div>
              )}

              {/* Crop button */}
              <button
                onClick={handleCrop}
                disabled={!completedCrop}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary text-white text-base font-bold rounded-2xl hover:bg-primary-hover transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CropIcon size={18} />
                Crop Image
              </button>
            </div>
          )}
        </div>
      )}

      {/* ─── STAGE 2: Cropping ─── */}
      {stage === "cropping" && (
        <div className="max-w-md mx-auto px-4 py-32 text-center space-y-6">
          <Loader2 size={48} className="animate-spin text-primary mx-auto" />
          <div>
            <h2 className="text-xl font-bold text-foreground mb-1">
              Cropping your image...
            </h2>
            <p className="text-sm text-muted">This will only take a moment</p>
          </div>
        </div>
      )}

      {/* ─── STAGE 3: Done ─── */}
      {stage === "done" && resultUrl && (
        <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">
          {/* Success card */}
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center space-y-2">
            <CheckCircle2 size={40} className="text-green-500 mx-auto" />
            <h2 className="text-xl font-bold text-foreground">
              Image cropped successfully
            </h2>
            <p className="text-sm text-green-700">
              {fmtBytes(originalSize)} &rarr; {fmtBytes(croppedSize)}
            </p>
          </div>

          {/* Before / After preview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
              <p className="text-xs font-bold text-muted uppercase tracking-wider">
                Original
              </p>
              <div className="aspect-video rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imgSrc}
                  alt="Original"
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              <p className="text-xs text-muted text-center">
                {fmtBytes(originalSize)}
              </p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
              <p className="text-xs font-bold text-muted uppercase tracking-wider">
                Cropped
              </p>
              <div className="aspect-video rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={resultUrl}
                  alt="Cropped"
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              <p className="text-xs text-muted text-center">
                {fmtBytes(croppedSize)}
              </p>
            </div>
          </div>

          {/* Download button */}
          <a
            href={resultUrl}
            download={resultName}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary text-white text-base font-bold rounded-2xl hover:bg-primary-hover transition-colors shadow-lg"
          >
            <Download size={18} />
            Download Cropped Image
          </a>

          {/* Start over */}
          <button
            onClick={reset}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-muted border border-border rounded-xl hover:border-primary/40 transition-colors"
          >
            Crop Another Image
          </button>
        </div>
      )}

      {/* ─── Bottom section (always visible) ─── */}
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
                    desc: "Select an image from your device",
                  },
                  {
                    step: "2",
                    title: "Select area",
                    desc: "Drag to choose the region you want to keep",
                  },
                  {
                    step: "3",
                    title: "Download",
                    desc: "Get your perfectly cropped image instantly",
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
                { label: "JPG, PNG, WEBP, GIF", sub: "All formats" },
                { label: "Aspect presets", sub: "1:1, 4:3, 16:9, 3:2" },
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
              { href: "/tools/resize", icon: Maximize2, label: "Resize Image" },
              {
                href: "/tools/compress",
                icon: Minimize2,
                label: "Compress Image",
              },
              {
                href: "/tools/photo-editor",
                icon: Wand2,
                label: "Photo Editor",
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

      <div className="max-w-3xl mx-auto px-4 pb-6">
        <KeyboardShortcuts />
      </div>

      <UpgradeModal
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
      />
    </div>
  );
}
