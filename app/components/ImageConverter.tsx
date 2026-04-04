"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  ImageIcon,
  Upload,
  Download,
  X,
  CheckCircle2,
  Loader2,
  Package,
  Plus,
} from "lucide-react";
import JSZip from "jszip";

/* ─── Types ─────────────────────────────────────────────────────────────────── */

interface Result {
  name: string;
  originalSize: number;
  convertedSize: number;
  url: string;
}

type Stage = "upload" | "converting" | "done";

const FORMATS = ["JPG", "PNG", "WEBP", "GIF", "TIFF", "AVIF", "ICO"] as const;

/* ─── Helpers ───────────────────────────────────────────────────────────────── */

function fmtBytes(n: number) {
  if (n < 1024) return n + " B";
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + " KB";
  return (n / (1024 * 1024)).toFixed(2) + " MB";
}

/* ─── Component ─────────────────────────────────────────────────────────────── */

export default function ImageConverter() {
  const [stage, setStage] = useState<Stage>("upload");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [targetFormat, setTargetFormat] = useState<string>("PNG");
  const [results, setResults] = useState<Result[]>([]);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);

  /* ── Drop handler ── */
  const onDrop = useCallback(
    (accepted: File[]) => {
      if (accepted.length === 0) return;
      setError(null);
      const newFiles = [...files, ...accepted].slice(0, 30);
      setFiles(newFiles);
      const newPreviews = newFiles.map((f) => URL.createObjectURL(f));
      setPreviews(newPreviews);
    },
    [files]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    maxSize: 20 * 1024 * 1024,
    noClick: files.length > 0,
    noKeyboard: files.length > 0,
  });

  /* ── Remove single file ── */
  const removeFile = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    setFiles((f) => f.filter((_, i) => i !== index));
    setPreviews((p) => p.filter((_, i) => i !== index));
  };

  /* ── Convert all files ── */
  const convertAll = async () => {
    if (files.length === 0) return;
    setStage("converting");
    setProgress({ done: 0, total: files.length });
    setResults([]);
    setError(null);

    const newResults: Result[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("targetFormat", targetFormat.toLowerCase());
        fd.append("quality", "85");

        const res = await fetch("/api/convert", {
          method: "POST",
          body: fd,
        });

        if (!res.ok) {
          const data = await res
            .json()
            .catch(() => ({ error: "Conversion failed" }));
          setError(data.error || `Failed to convert ${file.name}`);
          continue;
        }

        const blob = await res.blob();
        const disp = res.headers.get("Content-Disposition") || "";
        const match = disp.match(/filename="(.+?)"/);
        const baseName = file.name.replace(/\.[^.]+$/, "");
        const name =
          match?.[1] || `${baseName}.${targetFormat.toLowerCase()}`;

        newResults.push({
          name,
          originalSize: file.size,
          convertedSize: blob.size,
          url: URL.createObjectURL(blob),
        });
      } catch {
        setError(`Failed to convert ${file.name}`);
      }

      setProgress({ done: i + 1, total: files.length });
    }

    setResults(newResults);
    if (newResults.length > 0) {
      setStage("done");
    } else {
      setStage("upload");
      if (!error) setError("Conversion failed. Please try again.");
    }
  };

  /* ── Download all / single ── */
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
    a.download = "converted-images.zip";
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ── Reset ── */
  const reset = () => {
    previews.forEach((p) => URL.revokeObjectURL(p));
    results.forEach((r) => URL.revokeObjectURL(r.url));
    setFiles([]);
    setPreviews([]);
    setResults([]);
    setStage("upload");
    setError(null);
  };

  /* ─── Render ──────────────────────────────────────────────────────────────── */

  return (
    <div className="min-h-screen bg-background">
      {/* ─── STAGE 1: Upload ─── */}
      {stage === "upload" && (
        <div className="max-w-4xl mx-auto px-4 py-16">
          {/* Hero */}
          <div className="text-center space-y-3 mb-10">
            <h1 className="text-4xl font-extrabold text-foreground">
              Convert Images
            </h1>
            <p className="text-muted max-w-lg mx-auto">
              Convert between JPG, PNG, WEBP, AVIF, GIF, TIFF, ICO formats.
              Free, fast, no files stored.
            </p>
          </div>

          {/* Drop zone or thumbnail grid */}
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
              <p className="text-xs text-muted mt-3">
                JPG, PNG, WEBP, GIF, AVIF, TIFF, ICO. Up to 20 MB each. Max 30
                files.
              </p>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto space-y-6">
              {/* File thumbnails grid */}
              <div {...getRootProps()} className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                <input {...getInputProps()} />
                {files.map((f, i) => (
                  <div key={f.name + i} className="relative group">
                    <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 border border-border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={previews[i]}
                        alt={f.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(i);
                      }}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={10} />
                    </button>
                    <p className="text-[9px] text-muted text-center mt-1 truncate">
                      {fmtBytes(f.size)}
                    </p>
                  </div>
                ))}

                {/* Add more button */}
                {files.length < 30 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      open();
                    }}
                    className="aspect-square rounded-xl border-2 border-dashed border-border hover:border-primary/60 flex flex-col items-center justify-center gap-1 transition-colors"
                  >
                    <Plus size={20} className="text-muted" />
                    <span className="text-[10px] text-muted">Add</span>
                  </button>
                )}
              </div>

              <p className="text-xs text-muted text-center">
                {files.length} image{files.length !== 1 ? "s" : ""} selected
              </p>

              {/* Target format selector */}
              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground text-center">
                  Convert to:
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {FORMATS.map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => setTargetFormat(fmt)}
                      className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                        targetFormat === fmt
                          ? "bg-primary text-white shadow-md"
                          : "bg-card border border-border text-foreground hover:border-primary/40"
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Convert button */}
              <button
                onClick={convertAll}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary text-white text-base font-bold rounded-2xl hover:bg-primary-hover transition-colors shadow-lg"
              >
                <ImageIcon size={18} />
                Convert {files.length > 1 ? `${files.length} Images` : "Image"}{" "}
                to {targetFormat}
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
        <div className="max-w-md mx-auto px-4 py-32 text-center space-y-6">
          <Loader2 size={48} className="animate-spin text-primary mx-auto" />
          <div>
            <h2 className="text-xl font-bold text-foreground mb-1">
              Converting images...
            </h2>
            <p className="text-sm text-muted">
              {progress.done} of {progress.total} done
            </p>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{
                width: `${
                  progress.total > 0
                    ? (progress.done / progress.total) * 100
                    : 0
                }%`,
              }}
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
              {results.length} image{results.length !== 1 ? "s" : ""} converted
            </h2>
            <p className="text-xs text-muted">
              Converted to {targetFormat} format
            </p>
          </div>

          {/* Download button */}
          <button
            onClick={downloadAll}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary text-white text-base font-bold rounded-2xl hover:bg-primary-hover transition-colors shadow-lg"
          >
            {results.length > 1 ? (
              <Package size={18} />
            ) : (
              <Download size={18} />
            )}
            {results.length > 1
              ? "Download All (ZIP)"
              : "Download Converted Image"}
          </button>

          {/* Individual results */}
          <div className="space-y-2">
            {results.map((r) => (
              <div
                key={r.name}
                className="bg-card border border-border rounded-xl p-3 flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={r.url}
                    alt={r.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {r.name}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted">
                    <span>{fmtBytes(r.originalSize)}</span>
                    <span>&rarr;</span>
                    <span>{fmtBytes(r.convertedSize)}</span>
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
            Convert More Images
          </button>
        </div>
      )}

      {/* ─── Bottom section (upload stage only) ─── */}
      {stage === "upload" && (
        <div className="max-w-3xl mx-auto px-4 pb-12 space-y-8">
          {/* How it works */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="font-bold text-foreground mb-4">How it works</h2>
            <div className="grid grid-cols-3 gap-4 text-center">
              {[
                {
                  step: "1",
                  title: "Upload",
                  desc: "Select one or more images from your device",
                },
                {
                  step: "2",
                  title: "Convert",
                  desc: "Choose your target format and we handle the rest",
                },
                {
                  step: "3",
                  title: "Download",
                  desc: "Download converted files individually or as ZIP",
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
              { label: "8+ Formats", sub: "JPG, PNG, WEBP, AVIF..." },
              { label: "Batch convert", sub: "Up to 30 files" },
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
        </div>
      )}
    </div>
  );
}
