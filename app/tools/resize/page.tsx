"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Maximize2, Upload, Download, X, CheckCircle2, Loader2, Package, Minimize2, Crop, Wand2, Plus, ImageIcon, Lock, Unlock } from "lucide-react";
import Link from "next/link";
import JSZip from "jszip";

interface Preset { label: string; w: number; h: number }

const PLATFORM_PRESETS: { platform: string; icon: string; presets: Preset[] }[] = [
  {
    platform: "Instagram",
    icon: "IG",
    presets: [
      { label: "Square Post", w: 1080, h: 1080 },
      { label: "Portrait Post", w: 1080, h: 1350 },
      { label: "Story / Reel", w: 1080, h: 1920 },
      { label: "Profile Photo", w: 320, h: 320 },
    ],
  },
  {
    platform: "Facebook",
    icon: "FB",
    presets: [
      { label: "Post", w: 1200, h: 630 },
      { label: "Cover Photo", w: 851, h: 315 },
      { label: "Story", w: 1080, h: 1920 },
    ],
  },
  {
    platform: "X (Twitter)",
    icon: "X",
    presets: [
      { label: "Post Image", w: 1600, h: 900 },
      { label: "Profile Photo", w: 400, h: 400 },
      { label: "Header", w: 1500, h: 500 },
    ],
  },
  {
    platform: "LinkedIn",
    icon: "LI",
    presets: [
      { label: "Post Image", w: 1200, h: 627 },
      { label: "Cover Photo", w: 1584, h: 396 },
      { label: "Profile Photo", w: 400, h: 400 },
    ],
  },
  {
    platform: "YouTube",
    icon: "YT",
    presets: [
      { label: "Thumbnail", w: 1280, h: 720 },
      { label: "Channel Art", w: 2560, h: 1440 },
    ],
  },
  {
    platform: "WhatsApp",
    icon: "WA",
    presets: [
      { label: "Profile Photo", w: 500, h: 500 },
    ],
  },
  {
    platform: "Standard",
    icon: "HD",
    presets: [
      { label: "HD 1080p", w: 1920, h: 1080 },
      { label: "4K UHD", w: 3840, h: 2160 },
    ],
  },
];

interface Result {
  name: string;
  originalName: string;
  originalSize: number;
  newSize: number;
  url: string;
  widthIn: string;
  heightIn: string;
  widthOut: number;
  heightOut: number;
}

function fmtBytes(n: number) {
  if (n < 1024) return n + " B";
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + " KB";
  return (n / (1024 * 1024)).toFixed(2) + " MB";
}

type Stage = "upload" | "resizing" | "done";

export default function ResizePage() {
  const [stage, setStage] = useState<Stage>("upload");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);

  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [locked, setLocked] = useState(true);
  const [fit, setFit] = useState("inside");
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);

  const applyPreset = (w: number, h: number) => {
    setWidth(String(w));
    setHeight(String(h));
  };

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted.length === 0) return;
    setError(null);
    const newFiles = [...files, ...accepted].slice(0, 30);
    setFiles(newFiles);
    const newPreviews = newFiles.map((f) => URL.createObjectURL(f));
    setPreviews(newPreviews);
  }, [files]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    maxSize: 20 * 1024 * 1024,
    noClick: files.length > 0,
    noKeyboard: files.length > 0,
  });

  const removeFile = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    setFiles((f) => f.filter((_, i) => i !== index));
    setPreviews((p) => p.filter((_, i) => i !== index));
  };

  const resizeAll = async () => {
    if (files.length === 0) return;
    if (!width && !height) {
      setError("Enter a width or height before resizing.");
      return;
    }
    setStage("resizing");
    setProgress({ done: 0, total: files.length });
    setResults([]);
    setError(null);

    const newResults: Result[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const fd = new FormData();
        fd.append("file", file);
        if (width) fd.append("width", width);
        if (height) fd.append("height", height);
        fd.append("fit", fit);
        if (locked) fd.append("lockAspectRatio", "true");

        const res = await fetch("/api/tools/resize", {
          method: "POST",
          body: fd,
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({ error: "Resize failed" }));
          setError(data.error || `Failed to resize ${file.name}`);
          continue;
        }

        const blob = await res.blob();
        const disp = res.headers.get("Content-Disposition") || "";
        const match = disp.match(/filename="(.+?)"/);
        const name = match?.[1] || file.name.replace(/\.[^.]+$/, "-resized.jpg");

        // Get actual output dimensions by loading the image
        let widthOut = width ? parseInt(width) : 0;
        let heightOut = height ? parseInt(height) : 0;
        try {
          const img = new Image();
          const loadPromise = new Promise<void>((resolve) => {
            img.onload = () => {
              widthOut = img.naturalWidth;
              heightOut = img.naturalHeight;
              resolve();
            };
            img.onerror = () => resolve();
          });
          img.src = URL.createObjectURL(blob);
          await loadPromise;
          URL.revokeObjectURL(img.src);
        } catch {
          // fallback to input dimensions
        }

        newResults.push({
          name,
          originalName: file.name,
          originalSize: file.size,
          newSize: blob.size,
          url: URL.createObjectURL(blob),
          widthIn: width || "auto",
          heightIn: height || "auto",
          widthOut,
          heightOut,
        });
      } catch {
        setError(`Failed to resize ${file.name}`);
      }

      setProgress({ done: i + 1, total: files.length });
    }

    setResults(newResults);
    if (newResults.length > 0) {
      setStage("done");
    } else {
      setStage("upload");
      if (!error) setError("Resize failed. Please try again.");
    }
  };

  const downloadAll = async () => {
    if (results.length === 1) {
      const a = document.createElement("a");
      a.href = results[0].url;
      a.download = results[0].name;
      a.click();
      return;
    }

    const zip = new JSZip();
    for (const r of results) {
      const resp = await fetch(r.url);
      const blob = await resp.blob();
      zip.file(r.name, blob);
    }
    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const a = document.createElement("a");
    a.href = url;
    a.download = "resized-images.zip";
    a.click();
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    previews.forEach((p) => URL.revokeObjectURL(p));
    results.forEach((r) => URL.revokeObjectURL(r.url));
    setFiles([]);
    setPreviews([]);
    setResults([]);
    setStage("upload");
    setError(null);
    setWidth("");
    setHeight("");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ─── STAGE 1: Upload ─── */}
      {stage === "upload" && (
        <div className="max-w-4xl mx-auto px-4 py-16">
          {/* Hero */}
          <div className="text-center space-y-3 mb-10">
            <h1 className="text-4xl font-extrabold text-foreground">Resize Images</h1>
            <p className="text-muted max-w-lg mx-auto">
              Change image dimensions to any size. Choose from social media presets or enter custom values.
            </p>
          </div>

          {/* Drop zone */}
          {files.length === 0 ? (
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
                {isDragActive ? "Drop images here" : "Select images"}
              </p>
              <p className="text-sm text-muted">or drag and drop them here</p>
              <p className="text-xs text-muted mt-3">JPG, PNG, WEBP, GIF. Up to 20 MB each. Max 30 files.</p>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto space-y-4">
              {/* File thumbnails grid */}
              <div {...getRootProps()} className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                <input {...getInputProps()} />
                {files.map((f, i) => (
                  <div key={f.name + i} className="relative group">
                    <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 border border-border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={previews[i]} alt={f.name} className="w-full h-full object-cover" />
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={10} />
                    </button>
                    <p className="text-[9px] text-muted text-center mt-1 truncate">{fmtBytes(f.size)}</p>
                  </div>
                ))}

                {/* Add more button */}
                <button
                  onClick={(e) => { e.stopPropagation(); open(); }}
                  className="aspect-square rounded-xl border-2 border-dashed border-border hover:border-primary/60 flex flex-col items-center justify-center gap-1 transition-colors"
                >
                  <Plus size={20} className="text-muted" />
                  <span className="text-[10px] text-muted">Add</span>
                </button>
              </div>

              <p className="text-xs text-muted text-center">
                {files.length} image{files.length !== 1 ? "s" : ""} selected
              </p>

              {/* Controls card */}
              <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
                {/* Platform tabs */}
                <div>
                  <p className="text-xs font-bold text-muted uppercase tracking-wider mb-2">Social Media Presets</p>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {PLATFORM_PRESETS.map((group) => (
                      <button
                        key={group.platform}
                        onClick={() => setSelectedPlatform(selectedPlatform === group.platform ? null : group.platform)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          selectedPlatform === group.platform
                            ? "bg-primary text-white shadow-sm"
                            : "bg-gray-100 text-foreground hover:bg-gray-200"
                        }`}
                      >
                        {group.platform}
                      </button>
                    ))}
                    <button
                      onClick={() => { setSelectedPlatform(null); setWidth(""); setHeight(""); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        !selectedPlatform && !width && !height
                          ? "bg-primary text-white shadow-sm"
                          : "bg-gray-100 text-foreground hover:bg-gray-200"
                      }`}
                    >
                      Custom
                    </button>
                  </div>

                  {/* Preset buttons for selected platform */}
                  {selectedPlatform && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {PLATFORM_PRESETS.find((g) => g.platform === selectedPlatform)?.presets.map((p) => (
                        <button
                          key={p.label}
                          onClick={() => applyPreset(p.w, p.h)}
                          className={`px-3 py-2.5 border rounded-xl text-left transition-all ${
                            width === String(p.w) && height === String(p.h)
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/40"
                          }`}
                        >
                          <p className={`text-xs font-semibold ${width === String(p.w) && height === String(p.h) ? "text-primary" : "text-foreground"}`}>
                            {p.label}
                          </p>
                          <p className="text-[10px] text-muted mt-0.5">{p.w} x {p.h}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Dimensions */}
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="text-xs font-semibold text-muted block mb-1">Width (px)</label>
                    <input
                      type="number"
                      value={width}
                      onChange={(e) => setWidth(e.target.value)}
                      placeholder="e.g. 1920"
                      className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background"
                    />
                  </div>
                  <button
                    onClick={() => setLocked((l) => !l)}
                    className="mt-5 p-2 rounded-xl border border-border hover:border-primary text-muted hover:text-primary transition-colors"
                    title={locked ? "Aspect ratio locked" : "Aspect ratio unlocked"}
                  >
                    {locked ? <Lock size={16} /> : <Unlock size={16} />}
                  </button>
                  <div className="flex-1">
                    <label className="text-xs font-semibold text-muted block mb-1">Height (px)</label>
                    <input
                      type="number"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      placeholder="e.g. 1080"
                      className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background"
                    />
                  </div>
                </div>

                <p className="text-xs text-muted flex items-center gap-1.5">
                  {locked ? <Lock size={10} /> : <Unlock size={10} />}
                  {locked ? "Aspect ratio will be preserved" : "Image may be stretched to fit exact dimensions"}
                </p>
              </div>

              {/* Resize button */}
              <button
                onClick={resizeAll}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary text-white text-base font-bold rounded-2xl hover:bg-primary-hover transition-colors shadow-lg"
              >
                <Maximize2 size={18} />
                Resize {files.length > 1 ? `${files.length} Images` : "Image"}
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

      {/* ─── STAGE 2: Resizing ─── */}
      {stage === "resizing" && (
        <div className="max-w-md mx-auto px-4 py-32 text-center space-y-6">
          <Loader2 size={48} className="animate-spin text-primary mx-auto" />
          <div>
            <h2 className="text-xl font-bold text-foreground mb-1">Resizing images...</h2>
            <p className="text-sm text-muted">
              {progress.done} of {progress.total} done
            </p>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${progress.total > 0 ? (progress.done / progress.total) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {/* ─── STAGE 3: Results ─── */}
      {stage === "done" && results.length > 0 && (
        <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">
          {/* Summary card */}
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center space-y-2">
            <CheckCircle2 size={40} className="text-green-500 mx-auto" />
            <h2 className="text-xl font-bold text-foreground">
              {results.length} image{results.length !== 1 ? "s" : ""} resized
            </h2>
            <p className="text-sm text-green-700">
              Resized to {width || "auto"} &times; {height || "auto"} px
            </p>
          </div>

          {/* Download button */}
          <button
            onClick={downloadAll}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary text-white text-base font-bold rounded-2xl hover:bg-primary-hover transition-colors shadow-lg"
          >
            {results.length > 1 ? <Package size={18} /> : <Download size={18} />}
            {results.length > 1 ? "Download All (ZIP)" : "Download Resized Image"}
          </button>

          {/* Individual results */}
          <div className="space-y-2">
            {results.map((r) => (
              <div key={r.name} className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={r.url} alt={r.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{r.originalName}</p>
                  <div className="flex items-center gap-2 text-xs text-muted">
                    <span>{fmtBytes(r.originalSize)}</span>
                    <span>&rarr;</span>
                    <span className="font-semibold text-foreground">{r.widthOut}&times;{r.heightOut} px</span>
                    <span className="text-muted">({fmtBytes(r.newSize)})</span>
                  </div>
                </div>
                <a
                  href={r.url}
                  download={r.name}
                  className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors flex-shrink-0"
                >
                  <Download size={16} />
                </a>
              </div>
            ))}
          </div>

          {/* Start over */}
          <button
            onClick={reset}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-muted border border-border rounded-xl hover:border-primary/40 transition-colors"
          >
            Resize More Images
          </button>
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
                  { step: "1", title: "Upload", desc: "Select one or more images from your device" },
                  { step: "2", title: "Set Size", desc: "Enter custom dimensions or pick a preset" },
                  { step: "3", title: "Download", desc: "Download resized files individually or as ZIP" },
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

            {/* Features */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "JPG, PNG, WEBP, GIF", sub: "All formats" },
                { label: "Up to 30 files", sub: "Batch resize" },
                { label: "No sign-up", sub: "Free forever" },
                { label: "Files never stored", sub: "100% private" },
              ].map(({ label, sub }) => (
                <div key={label} className="bg-card border border-border rounded-xl p-3 text-center">
                  <p className="text-xs font-bold text-foreground">{label}</p>
                  <p className="text-[10px] text-muted">{sub}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Social media sizes SEO section */}
        {stage === "upload" && (
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="font-bold text-foreground mb-3">Standard Image Sizes for Social Media in 2026</h2>
            <p className="text-sm text-muted leading-relaxed mb-4">
              Each social media platform has specific image dimensions that produce the best results.
              Instagram portrait posts (1080x1350) take up the most feed space and get the highest engagement.
              Facebook post images work best at 1200x630. X/Twitter crops in-feed images to 16:9, so use 1600x900.
              YouTube thumbnails should always be 1280x720. Using the correct dimensions prevents awkward cropping
              and ensures your content looks polished on every platform.
            </p>
            <p className="text-sm text-muted leading-relaxed">
              Upload your images above and select any platform preset to resize automatically.
              The resizer preserves aspect ratio by default, so your images are never stretched or distorted.
            </p>
          </div>
        )}

        {/* Related Tools */}
        <div>
          <h3 className="text-sm font-bold text-muted uppercase tracking-wider mb-3">Related Tools</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { href: "/tools/compress", icon: Minimize2, label: "Compress" },
              { href: "/tools/crop", icon: Crop, label: "Crop" },
              { href: "/tools/photo-editor", icon: Wand2, label: "Photo Editor" },
            ].map(({ href, icon: Icon, label }) => (
              <Link key={href} href={href}
                className="flex flex-col items-center gap-2 p-3 rounded-xl border border-border hover:border-primary/30 hover:shadow-sm transition-all text-center group">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Icon size={16} className="text-primary" />
                </div>
                <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
