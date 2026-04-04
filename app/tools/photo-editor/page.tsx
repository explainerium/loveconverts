"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Wand2, Upload, Download, Loader2, Maximize2, Crop, Minimize2, RotateCcw, RotateCw, FlipHorizontal, FlipVertical, ImageIcon } from "lucide-react";
import Link from "next/link";
import UpgradeModal from "@/app/components/UpgradeModal";

function fmtBytes(n: number) {
  if (n < 1024) return n + " B";
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + " KB";
  return (n / (1024 * 1024)).toFixed(2) + " MB";
}

type Stage = "upload" | "editing" | "done";
type Filter = "none" | "grayscale" | "sepia" | "vintage";
type OutputFormat = "jpg" | "png" | "webp";

interface Adjustments {
  brightness: number;
  contrast: number;
  saturation: number;
  sharpness: number;
  filter: Filter;
  rotate: 0 | 90 | 180 | 270;
  flip: boolean;
  flop: boolean;
  outputFormat: OutputFormat;
}

const DEFAULT: Adjustments = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  sharpness: 0,
  filter: "none",
  rotate: 0,
  flip: false,
  flop: false,
  outputFormat: "jpg",
};

const SLIDERS: { key: "brightness" | "contrast" | "saturation" | "sharpness"; label: string; min: number; max: number }[] = [
  { key: "brightness", label: "Brightness", min: -50, max: 50 },
  { key: "contrast",   label: "Contrast",   min: -50, max: 50 },
  { key: "saturation", label: "Saturation", min: -50, max: 50 },
  { key: "sharpness",  label: "Sharpness",  min: 0,   max: 100 },
];

const FILTERS: { value: Filter; label: string }[] = [
  { value: "none",      label: "None" },
  { value: "grayscale", label: "Grayscale" },
  { value: "sepia",     label: "Sepia" },
  { value: "vintage",   label: "Vintage" },
];

const FORMATS: OutputFormat[] = ["jpg", "png", "webp"];

export default function PhotoEditorPage() {
  const [stage, setStage] = useState<Stage>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [adj, setAdj] = useState<Adjustments>(DEFAULT);
  const [error, setError] = useState<string | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);

  // Result state
  const [resultUrl, setResultUrl] = useState("");
  const [resultName, setResultName] = useState("");
  const [resultSize, setResultSize] = useState(0);

  const set = <K extends keyof Adjustments>(key: K, val: Adjustments[K]) =>
    setAdj((a) => ({ ...a, [key]: val }));

  const onDrop = useCallback((accepted: File[]) => {
    const f = accepted[0];
    if (!f) return;
    if (f.size > 20 * 1024 * 1024) {
      setError("File exceeds 20 MB limit.");
      return;
    }
    setError(null);
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setAdj(DEFAULT);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    maxFiles: 1,
    maxSize: 20 * 1024 * 1024,
  });

  const rotateLeft = () => {
    const steps: (0 | 90 | 180 | 270)[] = [0, 90, 180, 270];
    const idx = steps.indexOf(adj.rotate);
    set("rotate", steps[(idx + 3) % 4]);
  };

  const rotateRight = () => {
    const steps: (0 | 90 | 180 | 270)[] = [0, 90, 180, 270];
    const idx = steps.indexOf(adj.rotate);
    set("rotate", steps[(idx + 1) % 4]);
  };

  const applyEdits = async () => {
    if (!file) return;
    setStage("editing");
    setError(null);

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("preview", "false");
      fd.append("brightness", String(adj.brightness));
      fd.append("contrast", String(adj.contrast));
      fd.append("saturation", String(adj.saturation));
      fd.append("sharpness", String(adj.sharpness));
      fd.append("hue", "0");
      fd.append("blur", "0");
      fd.append("rotate", String(adj.rotate));
      fd.append("flip", String(adj.flip));
      fd.append("flop", String(adj.flop));
      fd.append("quality", "90");
      fd.append("outputFormat", adj.outputFormat);

      // Map filter to API params
      if (adj.filter === "grayscale") {
        fd.append("grayscale", "true");
        fd.append("sepia", "false");
      } else if (adj.filter === "sepia") {
        fd.append("grayscale", "false");
        fd.append("sepia", "true");
      } else if (adj.filter === "vintage") {
        // Vintage = sepia + lower saturation effect
        fd.append("grayscale", "false");
        fd.append("sepia", "true");
        fd.set("saturation", String(Math.min(adj.saturation, -20)));
        fd.set("contrast", String(Math.max(adj.contrast, 10)));
      } else {
        fd.append("grayscale", "false");
        fd.append("sepia", "false");
      }

      const res = await fetch("/api/tools/photo-editor", {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Edit failed" }));
        if (data.code === "RATE_LIMIT") {
          setShowUpgrade(true);
          setStage("upload");
          return;
        }
        setError(data.error || "Edit failed");
        setStage("upload");
        return;
      }

      const blob = await res.blob();
      const base = file.name.replace(/\.[^.]+$/, "");
      const name = `${base}-edited.${adj.outputFormat}`;

      setResultUrl(URL.createObjectURL(blob));
      setResultName(name);
      setResultSize(blob.size);
      setStage("done");
    } catch {
      setError("Edit failed. Please try again.");
      setStage("upload");
    }
  };

  const reset = () => {
    if (preview) URL.revokeObjectURL(preview);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setFile(null);
    setPreview("");
    setAdj(DEFAULT);
    setResultUrl("");
    setResultName("");
    setResultSize(0);
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
            <h1 className="text-4xl font-extrabold text-foreground">Photo Editor</h1>
            <p className="text-muted max-w-lg mx-auto">
              Adjust brightness, contrast, saturation and apply filters.
            </p>
          </div>

          {/* Drop zone (no file selected yet) */}
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
              <p className="text-xs text-muted mt-3">JPG, PNG, WEBP, AVIF. Up to 20 MB.</p>
            </div>
          ) : (
            /* File selected — show preview + controls */
            <div className="max-w-2xl mx-auto space-y-6">
              {/* Image preview */}
              <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview}
                  alt="Preview"
                  className="max-w-full max-h-[360px] object-contain rounded-xl"
                />
              </div>

              {/* Adjustment sliders */}
              <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
                <p className="text-xs font-bold text-muted uppercase tracking-wider">Adjustments</p>
                {SLIDERS.map(({ key, label, min, max }) => (
                  <div key={key}>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs font-semibold text-foreground">{label}</span>
                      <span className="text-xs font-bold text-primary">{adj[key]}</span>
                    </div>
                    <input
                      type="range"
                      min={min}
                      max={max}
                      step={1}
                      value={adj[key]}
                      onChange={(e) => set(key, Number(e.target.value))}
                      className="custom-range w-full"
                    />
                  </div>
                ))}
              </div>

              {/* Filters */}
              <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
                <p className="text-xs font-bold text-muted uppercase tracking-wider">Filter</p>
                <div className="flex gap-2 flex-wrap">
                  {FILTERS.map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => set("filter", value)}
                      className={`px-4 py-2 rounded-xl border text-xs font-bold transition-all ${
                        adj.filter === value
                          ? "border-primary bg-primary-light text-primary"
                          : "border-border text-muted hover:border-primary/40"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Transform */}
              <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
                <p className="text-xs font-bold text-muted uppercase tracking-wider">Transform</p>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={rotateLeft}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border text-xs font-bold text-muted hover:border-primary/40 hover:text-foreground transition-all"
                  >
                    <RotateCcw size={13} /> 90° Left
                  </button>
                  <button
                    onClick={rotateRight}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border text-xs font-bold text-muted hover:border-primary/40 hover:text-foreground transition-all"
                  >
                    <RotateCw size={13} /> 90° Right
                  </button>
                  <button
                    onClick={() => set("flip", !adj.flip)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border text-xs font-bold transition-all ${
                      adj.flip
                        ? "border-primary bg-primary-light text-primary"
                        : "border-border text-muted hover:border-primary/40"
                    }`}
                  >
                    <FlipVertical size={13} /> Flip V
                  </button>
                  <button
                    onClick={() => set("flop", !adj.flop)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border text-xs font-bold transition-all ${
                      adj.flop
                        ? "border-primary bg-primary-light text-primary"
                        : "border-border text-muted hover:border-primary/40"
                    }`}
                  >
                    <FlipHorizontal size={13} /> Flip H
                  </button>
                </div>
                {adj.rotate !== 0 && (
                  <p className="text-[11px] text-muted">Current rotation: {adj.rotate}°</p>
                )}
              </div>

              {/* Output format */}
              <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
                <p className="text-xs font-bold text-muted uppercase tracking-wider">Output Format</p>
                <div className="flex gap-2">
                  {FORMATS.map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => set("outputFormat", fmt)}
                      className={`px-5 py-2 rounded-xl border text-xs font-bold uppercase transition-all ${
                        adj.outputFormat === fmt
                          ? "border-primary bg-primary-light text-primary"
                          : "border-border text-muted hover:border-primary/40"
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <ImageIcon size={16} />
                  {error}
                </div>
              )}

              {/* Apply button */}
              <button
                onClick={applyEdits}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary text-white text-base font-bold rounded-2xl hover:bg-primary-hover transition-colors shadow-lg"
              >
                <Wand2 size={18} />
                Apply Edits
              </button>
            </div>
          )}

          {/* Error (when no file) */}
          {!file && error && (
            <div className="max-w-xl mx-auto mt-4 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <ImageIcon size={16} />
              {error}
            </div>
          )}
        </div>
      )}

      {/* ─── STAGE 2: Editing ─── */}
      {stage === "editing" && (
        <div className="max-w-md mx-auto px-4 py-32 text-center space-y-6">
          <Loader2 size={48} className="animate-spin text-primary mx-auto" />
          <div>
            <h2 className="text-xl font-bold text-foreground mb-1">Applying edits...</h2>
            <p className="text-sm text-muted">This will only take a moment</p>
          </div>
        </div>
      )}

      {/* ─── STAGE 3: Done ─── */}
      {stage === "done" && (
        <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">
          {/* Success summary */}
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <Wand2 size={24} className="text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Edits applied successfully</h2>
            <p className="text-xs text-muted">
              {file ? fmtBytes(file.size) : ""} → {fmtBytes(resultSize)}
            </p>
          </div>

          {/* Before / After preview */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-2xl p-3 text-center space-y-2">
              <p className="text-xs font-bold text-muted uppercase tracking-wider">Before</p>
              <div className="flex items-center justify-center min-h-[180px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview}
                  alt="Original"
                  className="max-w-full max-h-[240px] object-contain rounded-xl"
                />
              </div>
              {file && <p className="text-[11px] text-muted">{fmtBytes(file.size)}</p>}
            </div>
            <div className="bg-card border border-border rounded-2xl p-3 text-center space-y-2">
              <p className="text-xs font-bold text-muted uppercase tracking-wider">After</p>
              <div className="flex items-center justify-center min-h-[180px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={resultUrl}
                  alt="Edited"
                  className="max-w-full max-h-[240px] object-contain rounded-xl"
                />
              </div>
              <p className="text-[11px] text-muted">{fmtBytes(resultSize)}</p>
            </div>
          </div>

          {/* Download button */}
          <a
            href={resultUrl}
            download={resultName}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary text-white text-base font-bold rounded-2xl hover:bg-primary-hover transition-colors shadow-lg"
          >
            <Download size={18} />
            Download Edited Image
          </a>

          {/* Edit another */}
          <button
            onClick={reset}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-muted border border-border rounded-xl hover:border-primary/40 transition-colors"
          >
            Edit Another Image
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
                  { step: "1", title: "Upload", desc: "Select a photo from your device" },
                  { step: "2", title: "Adjust", desc: "Tweak sliders, pick a filter, rotate or flip" },
                  { step: "3", title: "Download", desc: "Apply edits and download the result" },
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
                { label: "Brightness & Contrast", sub: "Fine-tune lighting" },
                { label: "Filters & Effects", sub: "One-click styles" },
                { label: "Rotate & Flip", sub: "Fix orientation" },
                { label: "JPG, PNG, WEBP", sub: "Multiple formats" },
              ].map(({ label, sub }) => (
                <div key={label} className="bg-card border border-border rounded-xl p-3 text-center">
                  <p className="text-xs font-bold text-foreground">{label}</p>
                  <p className="text-[10px] text-muted">{sub}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Related Tools */}
        <div>
          <h3 className="text-sm font-bold text-muted uppercase tracking-wider mb-3">Related Tools</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { href: "/tools/compress", icon: Minimize2, label: "Compress" },
              { href: "/tools/resize",   icon: Maximize2, label: "Resize Image" },
              { href: "/tools/crop",     icon: Crop,      label: "Crop Image" },
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

      <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </div>
  );
}
