"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Eraser, Upload, Download, CheckCircle2, Loader2, Minimize2, Maximize2, Crop, Sparkles, ImageIcon, X } from "lucide-react";
import Link from "next/link";

function fmtBytes(n: number) {
  if (n < 1024) return n + " B";
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + " KB";
  return (n / (1024 * 1024)).toFixed(2) + " MB";
}

type Stage = "upload" | "processing" | "done";

export default function RemoveBackgroundPage() {
  const [stage, setStage] = useState<Stage>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((accepted: File[]) => {
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
  }, [preview]);

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

  const removeFile = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    setError(null);
  };

  const removeBackground = async () => {
    if (!file) return;
    setStage("processing");
    setError(null);
    setResultUrl(null);

    try {
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch("/api/tools/remove-background", {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Background removal failed");
        setStage("upload");
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      setStage("done");
    } catch {
      setError("Background removal failed. Please try again.");
      setStage("upload");
    }
  };

  const reset = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    setResultUrl(null);
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
            <h1 className="text-4xl font-extrabold text-foreground">Remove Background</h1>
            <p className="text-muted max-w-lg mx-auto">
              AI-powered background removal. Get a transparent PNG in seconds — no manual work needed.
            </p>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">
              <Sparkles size={10} /> Powered by AI
            </span>
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
              <p className="text-xs text-muted mt-3">JPG, PNG, WEBP. Up to 20 MB.</p>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto space-y-4">
              {/* File preview */}
              <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4">
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview || ""} alt={file.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{file.name}</p>
                  <p className="text-xs text-muted mt-0.5">{fmtBytes(file.size)}</p>
                </div>
                <button
                  onClick={removeFile}
                  className="w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors flex-shrink-0"
                >
                  <X size={12} />
                </button>
              </div>

              {/* Remove Background button */}
              <button
                onClick={removeBackground}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary text-white text-base font-bold rounded-2xl hover:bg-primary-hover transition-colors shadow-lg"
              >
                <Eraser size={18} />
                Remove Background
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

      {/* ─── STAGE 2: Processing ─── */}
      {stage === "processing" && (
        <div className="max-w-md mx-auto px-4 py-32 text-center space-y-6">
          <Loader2 size={48} className="animate-spin text-primary mx-auto" />
          <div>
            <h2 className="text-xl font-bold text-foreground mb-1">AI is removing the background...</h2>
            <p className="text-sm text-muted">
              This usually takes 5 to 15 seconds
            </p>
          </div>
        </div>
      )}

      {/* ─── STAGE 3: Done ─── */}
      {stage === "done" && resultUrl && (
        <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">
          {/* Success card */}
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center space-y-2">
            <CheckCircle2 size={40} className="text-green-500 mx-auto" />
            <h2 className="text-xl font-bold text-foreground">Background removed</h2>
            <p className="text-sm text-green-700">
              Your image is ready with a transparent background
            </p>
          </div>

          {/* Before / After */}
          <div>
            <h3 className="text-sm font-bold text-foreground mb-3">Before and After</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <span className="text-xs font-semibold text-muted uppercase">Original</span>
                <div className="rounded-xl overflow-hidden border border-border bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview || ""} alt="Original" className="w-full h-auto" />
                </div>
              </div>
              <div className="space-y-2">
                <span className="text-xs font-semibold text-muted uppercase">Result</span>
                <div
                  className="rounded-xl overflow-hidden border border-border"
                  style={{
                    backgroundImage: "repeating-conic-gradient(#d4d4d4 0% 25%, #fff 0% 50%)",
                    backgroundSize: "16px 16px",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={resultUrl} alt="Background removed" className="w-full h-auto" />
                </div>
              </div>
            </div>
          </div>

          {/* Download button */}
          <a
            href={resultUrl}
            download={(file?.name.replace(/\.[^/.]+$/, "") || "image") + "-no-bg.png"}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary text-white text-base font-bold rounded-2xl hover:bg-primary-hover transition-colors shadow-lg"
          >
            <Download size={18} />
            Download PNG
          </a>

          {/* Try Another */}
          <button
            onClick={reset}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-muted border border-border rounded-xl hover:border-primary/40 transition-colors"
          >
            Try Another Image
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
                  { step: "1", title: "Upload", desc: "Select an image from your device" },
                  { step: "2", title: "Remove", desc: "AI detects the subject and removes the background" },
                  { step: "3", title: "Download", desc: "Get your transparent PNG instantly" },
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
                { label: "People & objects", sub: "AI detection" },
                { label: "Transparent PNG", sub: "Clean output" },
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
              { href: "/tools/compress", icon: Minimize2, label: "Compress Image" },
              { href: "/tools/resize", icon: Maximize2, label: "Resize Image" },
              { href: "/tools/crop", icon: Crop, label: "Crop Image" },
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
