"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Minimize2, Upload, Download, X, CheckCircle2, Package, Maximize2, Crop, Wand2, Plus, ImageIcon } from "lucide-react";
import Link from "next/link";
import JSZip from "jszip";

interface Result {
  name: string;
  originalSize: number;
  compressedSize: number;
  url: string;
}

function fmtBytes(n: number) {
  if (n < 1024) return n + " B";
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + " KB";
  return (n / (1024 * 1024)).toFixed(2) + " MB";
}

type Stage = "upload" | "compressing" | "done";

export default function CompressPage() {
  const [stage, setStage] = useState<Stage>("upload");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [progress, setProgress] = useState({ done: 0, total: 0, currentPct: 0, currentName: "" });
  const [error, setError] = useState<string | null>(null);

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

  const compressOne = (
    file: File,
    onUploadPct: (pct: number) => void
  ): Promise<{ blob: Blob; name: string; origSize: number; compSize: number } | { error: string }> => {
    return new Promise((resolve) => {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("quality", "80");

      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/tools/compress");
      xhr.responseType = "blob";
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onUploadPct((e.loaded / e.total) * 100);
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const blob = xhr.response as Blob;
          const origSize = parseInt(xhr.getResponseHeader("X-Original-Size") || "0") || file.size;
          const compSize = parseInt(xhr.getResponseHeader("X-Compressed-Size") || "0") || blob.size;
          const disp = xhr.getResponseHeader("Content-Disposition") || "";
          const match = disp.match(/filename="(.+?)"/);
          const name = match?.[1] || file.name;
          resolve({ blob, name, origSize, compSize });
        } else {
          const reader = new FileReader();
          reader.onload = () => {
            try {
              const data = JSON.parse(reader.result as string);
              resolve({ error: data.error || `HTTP ${xhr.status}` });
            } catch {
              resolve({ error: `HTTP ${xhr.status}` });
            }
          };
          reader.onerror = () => resolve({ error: `HTTP ${xhr.status}` });
          reader.readAsText(xhr.response);
        }
      };
      xhr.onerror = () => resolve({ error: "Network error" });
      xhr.send(fd);
    });
  };

  const compressAll = async () => {
    if (files.length === 0) return;
    setStage("compressing");
    setProgress({ done: 0, total: files.length, currentPct: 0, currentName: files[0]?.name || "" });
    setResults([]);
    setError(null);

    const newResults: Result[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setProgress((p) => ({ ...p, currentPct: 0, currentName: file.name }));

      const res = await compressOne(file, (pct) => {
        setProgress((p) => ({ ...p, currentPct: pct }));
      });

      if ("error" in res) {
        setError(`${file.name}: ${res.error}`);
      } else {
        newResults.push({
          name: res.name,
          originalSize: res.origSize,
          compressedSize: res.compSize,
          url: URL.createObjectURL(res.blob),
        });
      }

      setProgress({
        done: i + 1,
        total: files.length,
        currentPct: 100,
        currentName: file.name,
      });
    }

    setResults(newResults);
    if (newResults.length > 0) {
      setStage("done");
    } else {
      setStage("upload");
      if (!error) setError("Compression failed. Please try again.");
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
    a.download = "compressed-images.zip";
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
  };

  const totalOriginal = results.reduce((sum, r) => sum + r.originalSize, 0);
  const totalCompressed = results.reduce((sum, r) => sum + r.compressedSize, 0);
  const totalSaved = totalOriginal - totalCompressed;
  const totalPct = totalOriginal > 0 ? ((totalSaved / totalOriginal) * 100).toFixed(0) : "0";

  return (
    <div className="min-h-screen bg-background">
      {/* ─── STAGE 1: Upload ─── */}
      {stage === "upload" && (
        <div className="max-w-4xl mx-auto px-4 py-16">
          {/* Hero */}
          <div className="text-center space-y-3 mb-10">
            <h1 className="text-4xl font-extrabold text-foreground">Compress Images</h1>
            <p className="text-muted max-w-lg mx-auto">
              Reduce the file size of JPG, PNG, WEBP and GIF images. Just upload and we handle the rest.
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
              <p className="text-xs text-muted mt-3">JPG, PNG, WEBP, GIF, AVIF. Up to 20 MB each. Max 30 files.</p>
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

              {/* Compress button */}
              <button
                onClick={compressAll}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary text-white text-base font-bold rounded-2xl hover:bg-primary-hover transition-colors shadow-lg"
              >
                <Minimize2 size={18} />
                Compress {files.length > 1 ? `${files.length} Images` : "Image"}
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

      {/* ─── STAGE 2: Compressing — rich progress ─── */}
      {stage === "compressing" && (() => {
        const overall =
          progress.total > 0
            ? ((progress.done + progress.currentPct / 100) / progress.total) * 100
            : 0;
        const overallRounded = Math.min(100, Math.round(overall));
        return (
          <div className="max-w-xl mx-auto px-4 py-16 space-y-8">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 bg-primary-light text-primary text-xs font-bold px-3 py-1 rounded-full">
                <Minimize2 size={12} />
                Compressing
              </div>
              <h2 className="text-2xl font-extrabold text-foreground">
                {progress.done < progress.total ? "Compressing images…" : "Finalizing…"}
              </h2>
              <p className="text-sm text-muted">
                {Math.min(progress.done + 1, progress.total)} of {progress.total}
                {progress.currentName && (
                  <span className="block text-xs mt-0.5 truncate max-w-xs mx-auto" title={progress.currentName}>
                    {progress.currentName}
                  </span>
                )}
              </p>
            </div>

            <div className="relative w-48 h-48 mx-auto">
              <svg className="w-48 h-48 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" className="text-gray-100" />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 45}`}
                  strokeDashoffset={`${2 * Math.PI * 45 * (1 - overallRounded / 100)}`}
                  className="text-primary transition-all duration-300"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-4xl font-extrabold text-foreground tabular-nums">{overallRounded}%</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted">complete</p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-bold uppercase tracking-wider text-muted">Files</p>
                <p className="text-xs font-bold text-muted tabular-nums">
                  {progress.done} / {progress.total}
                </p>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-2 bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${progress.total > 0 ? (progress.done / progress.total) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-bold uppercase tracking-wider text-primary">Current file</p>
                <p className="text-xs font-bold text-primary tabular-nums">
                  {Math.round(progress.currentPct)}%
                </p>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-2 bg-gradient-to-r from-primary to-orange-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.round(progress.currentPct)}%` }}
                />
              </div>
            </div>
          </div>
        );
      })()}

      {/* ─── STAGE 3: Results ─── */}
      {stage === "done" && results.length > 0 && (
        <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">
          {/* Summary card */}
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center space-y-2">
            <CheckCircle2 size={40} className="text-green-500 mx-auto" />
            <h2 className="text-xl font-bold text-foreground">
              {results.length} image{results.length !== 1 ? "s" : ""} compressed
            </h2>
            <p className="text-sm text-green-700">
              Saved {fmtBytes(totalSaved)} ({totalPct}% smaller)
            </p>
            <p className="text-xs text-muted">
              {fmtBytes(totalOriginal)} → {fmtBytes(totalCompressed)}
            </p>
          </div>

          {/* Download button */}
          <button
            onClick={downloadAll}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary text-white text-base font-bold rounded-2xl hover:bg-primary-hover transition-colors shadow-lg"
          >
            {results.length > 1 ? <Package size={18} /> : <Download size={18} />}
            {results.length > 1 ? "Download All (ZIP)" : "Download Compressed Image"}
          </button>

          {/* Individual results */}
          <div className="space-y-2">
            {results.map((r) => {
              const saved = r.originalSize - r.compressedSize;
              const pct = ((saved / r.originalSize) * 100).toFixed(0);
              return (
                <div key={r.name} className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={r.url} alt={r.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{r.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted">
                      <span>{fmtBytes(r.originalSize)}</span>
                      <span>→</span>
                      <span className="text-green-600 font-semibold">{fmtBytes(r.compressedSize)}</span>
                      {saved > 0 && (
                        <span className="text-green-600 font-semibold">({pct}% saved)</span>
                      )}
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
              );
            })}
          </div>

          {/* Start over */}
          <button
            onClick={reset}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-muted border border-border rounded-xl hover:border-primary/40 transition-colors"
          >
            Compress More Images
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
                  { step: "1", title: "Upload", desc: "Select one or more images from your device" },
                  { step: "2", title: "Compress", desc: "We automatically compress with optimal settings" },
                  { step: "3", title: "Download", desc: "Download compressed files individually or as ZIP" },
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
                { label: "Up to 30 files", sub: "Batch compress" },
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

        {/* Related Tools */}
        <div>
          <h3 className="text-sm font-bold text-muted uppercase tracking-wider mb-3">Related Tools</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { href: "/tools/resize", icon: Maximize2, label: "Resize Image" },
              { href: "/tools/crop", icon: Crop, label: "Crop Image" },
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
