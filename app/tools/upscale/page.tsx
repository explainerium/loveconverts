"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Maximize2, Upload, Download, CheckCircle2, Loader2, ArrowRight, Minimize2, Crop, Wand2, ImageIcon } from "lucide-react";
import Link from "next/link";

type Scale = 2 | 4;

function fmtBytes(n: number) {
  if (n < 1024) return n + " B";
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + " KB";
  return (n / (1024 * 1024)).toFixed(2) + " MB";
}

interface UploadedFile {
  file: File;
  previewUrl: string;
  width: number;
  height: number;
}

type Stage = "upload" | "upscaling" | "done";

export default function UpscalePage() {
  const [stage, setStage] = useState<Stage>("upload");
  const [uploaded, setUploaded] = useState<UploadedFile | null>(null);
  const [scale, setScale] = useState<Scale>(2);
  const [outputFormat, setOutputFormat] = useState("same");
  const [error, setError] = useState<string | null>(null);

  // Result state
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultName, setResultName] = useState("");
  const [resultSize, setResultSize] = useState(0);
  const [origDims, setOrigDims] = useState({ w: 0, h: 0 });
  const [newDims, setNewDims] = useState({ w: 0, h: 0 });

  const loadImageDimensions = useCallback((file: File): Promise<UploadedFile> => {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        resolve({ file, previewUrl: url, width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Could not read image dimensions."));
      };
      img.src = url;
    });
  }, []);

  const onDrop = useCallback(async (accepted: File[]) => {
    const f = accepted[0];
    if (!f) return;
    setError(null);

    if (f.size > 20 * 1024 * 1024) {
      setError("File exceeds 20 MB limit.");
      return;
    }

    try {
      if (uploaded) URL.revokeObjectURL(uploaded.previewUrl);
      const upload = await loadImageDimensions(f);
      setUploaded(upload);
    } catch {
      setError("Could not read image. Please try a different file.");
    }
  }, [loadImageDimensions, uploaded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    maxSize: 20 * 1024 * 1024,
    multiple: false,
    noClick: !!uploaded,
    noKeyboard: !!uploaded,
  });

  const removeFile = () => {
    if (uploaded) URL.revokeObjectURL(uploaded.previewUrl);
    setUploaded(null);
    setError(null);
  };

  const upscaleImage = async () => {
    if (!uploaded) return;
    setStage("upscaling");
    setError(null);

    try {
      const fd = new FormData();
      fd.append("file", uploaded.file);
      fd.append("scale", String(scale));
      if (outputFormat !== "same") fd.append("outputFormat", outputFormat);

      const res = await fetch("/api/tools/upscale", { method: "POST", body: fd });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Upscale failed" }));
        setError(data.error || "Upscale failed");
        setStage("upload");
        return;
      }

      const blob = await res.blob();
      const disp = res.headers.get("Content-Disposition") || "";
      const match = disp.match(/filename="(.+?)"/);
      const name = match?.[1] || uploaded.file.name.replace(/\.[^.]+$/, `-upscaled-${scale}x.jpg`);

      const ow = parseInt(res.headers.get("X-Original-Width") || "0") || uploaded.width;
      const oh = parseInt(res.headers.get("X-Original-Height") || "0") || uploaded.height;
      const nw = parseInt(res.headers.get("X-New-Width") || "0") || uploaded.width * scale;
      const nh = parseInt(res.headers.get("X-New-Height") || "0") || uploaded.height * scale;

      if (resultUrl) URL.revokeObjectURL(resultUrl);
      setResultUrl(URL.createObjectURL(blob));
      setResultName(name);
      setResultSize(blob.size);
      setOrigDims({ w: ow, h: oh });
      setNewDims({ w: nw, h: nh });
      setStage("done");
    } catch {
      setError("Upscale failed. Please try again.");
      setStage("upload");
    }
  };

  const downloadResult = () => {
    if (!resultUrl) return;
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = resultName;
    a.click();
  };

  const reset = () => {
    if (uploaded) URL.revokeObjectURL(uploaded.previewUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setUploaded(null);
    setResultUrl(null);
    setResultName("");
    setResultSize(0);
    setOrigDims({ w: 0, h: 0 });
    setNewDims({ w: 0, h: 0 });
    setStage("upload");
    setError(null);
    setScale(2);
    setOutputFormat("same");
  };

  const estimatedWidth = uploaded ? Math.min(uploaded.width * scale, 8192) : 0;
  const estimatedHeight = uploaded ? Math.min(uploaded.height * scale, 8192) : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* --- STAGE 1: Upload --- */}
      {stage === "upload" && (
        <div className="max-w-4xl mx-auto px-4 py-16">
          {/* Hero */}
          <div className="text-center space-y-3 mb-10">
            <h1 className="text-4xl font-extrabold text-foreground">Upscale Image</h1>
            <p className="text-muted max-w-lg mx-auto">
              Enlarge images 2x or 4x while keeping sharpness.
            </p>
          </div>

          {/* Drop zone */}
          {!uploaded ? (
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
              <p className="text-xs text-muted mt-3">JPG, PNG, WEBP, GIF, AVIF. Up to 20 MB.</p>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto space-y-4">
              {/* Preview with dimensions */}
              <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={uploaded.previewUrl} alt={uploaded.file.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{uploaded.file.name}</p>
                    <p className="text-xs text-muted mt-0.5">{fmtBytes(uploaded.file.size)}</p>
                    <p className="text-xs text-muted mt-1">
                      {uploaded.width} x {uploaded.height} px
                    </p>
                  </div>
                  <button
                    onClick={removeFile}
                    className="p-1.5 text-muted hover:text-red-500 transition-colors flex-shrink-0"
                  >
                    <span className="sr-only">Remove</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              </div>

              {/* Scale pills */}
              <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
                <span className="text-sm font-semibold text-foreground block">Scale Factor</span>
                <div className="flex gap-3">
                  {([2, 4] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setScale(s)}
                      className={`flex-1 px-4 py-3 text-sm font-bold rounded-full border transition-all text-center ${
                        scale === s
                          ? "border-primary bg-primary-light text-primary"
                          : "border-border text-foreground hover:border-primary/40"
                      }`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>

                {/* Estimated output */}
                <div className="flex items-center justify-center gap-3 text-sm text-muted">
                  <span>{uploaded.width} x {uploaded.height}</span>
                  <ArrowRight size={14} className="text-primary" />
                  <span className="text-primary font-bold">{estimatedWidth} x {estimatedHeight}</span>
                </div>
              </div>

              {/* Upscale button */}
              <button
                onClick={upscaleImage}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary text-white text-base font-bold rounded-2xl hover:bg-primary-hover transition-colors shadow-lg"
              >
                <Maximize2 size={18} />
                Upscale Image
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

      {/* --- STAGE 2: Upscaling --- */}
      {stage === "upscaling" && (
        <div className="max-w-md mx-auto px-4 py-32 text-center space-y-6">
          <Loader2 size={48} className="animate-spin text-primary mx-auto" />
          <div>
            <h2 className="text-xl font-bold text-foreground mb-1">Upscaling your image...</h2>
            <p className="text-sm text-muted">This may take a moment for large images</p>
          </div>
        </div>
      )}

      {/* --- STAGE 3: Done --- */}
      {stage === "done" && resultUrl && (
        <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">
          {/* Success card */}
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center space-y-2">
            <CheckCircle2 size={40} className="text-green-500 mx-auto" />
            <h2 className="text-xl font-bold text-foreground">Image upscaled!</h2>
            <div className="flex items-center justify-center gap-3 text-sm text-green-700">
              <span>{origDims.w} x {origDims.h}</span>
              <ArrowRight size={14} />
              <span className="font-bold">{newDims.w} x {newDims.h}</span>
            </div>
            <p className="text-xs text-muted">
              {uploaded ? fmtBytes(uploaded.file.size) : ""} &rarr; {fmtBytes(resultSize)}
            </p>
          </div>

          {/* Download button */}
          <button
            onClick={downloadResult}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary text-white text-base font-bold rounded-2xl hover:bg-primary-hover transition-colors shadow-lg"
          >
            <Download size={18} />
            Download Upscaled Image
          </button>

          {/* Start over */}
          <button
            onClick={reset}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-muted border border-border rounded-xl hover:border-primary/40 transition-colors"
          >
            Upscale Another Image
          </button>
        </div>
      )}

      {/* --- Bottom section (always visible) --- */}
      <div className="max-w-3xl mx-auto px-4 pb-12 space-y-8">
        {stage === "upload" && (
          <>
            {/* How it works */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="font-bold text-foreground mb-4">How it works</h2>
              <div className="grid grid-cols-3 gap-4 text-center">
                {[
                  { step: "1", title: "Upload", desc: "Select an image from your device" },
                  { step: "2", title: "Choose scale", desc: "Pick 2x or 4x enlargement factor" },
                  { step: "3", title: "Download", desc: "Get your upscaled image instantly" },
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
                { label: "2x & 4x upscale", sub: "Up to 8192px" },
                { label: "Lanczos3 resampling", sub: "Sharp results" },
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
