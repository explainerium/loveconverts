"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Maximize2, Upload, Download, X, Loader2, AlertCircle, ArrowRight, Minimize2, Crop, Wand2 } from "lucide-react";
import Link from "next/link";
import UpgradeModal from "@/app/components/UpgradeModal";

type Scale = 2 | 4;

function fmtBytes(n: number) {
  if (n < 1024) return n + " B";
  if (n < 1048576) return (n / 1024).toFixed(1) + " KB";
  return (n / 1048576).toFixed(2) + " MB";
}

interface UploadedFile {
  file: File;
  previewUrl: string;
  width: number;
  height: number;
}

interface Result {
  name: string;
  url: string;
  originalWidth: number;
  originalHeight: number;
  newWidth: number;
  newHeight: number;
  originalSize: number;
  newSize: number;
}

export default function UpscalePage() {
  const [scale, setScale]             = useState<Scale>(2);
  const [outputFormat, setOutputFormat] = useState("same");
  const [uploaded, setUploaded]       = useState<UploadedFile | null>(null);
  const [results, setResults]         = useState<Result[]>([]);
  const [processing, setProcessing]   = useState(false);
  const [error, setError]             = useState("");
  const [showUpgrade, setShowUpgrade] = useState(false);

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

  const upscaleFile = useCallback(async (upload: UploadedFile) => {
    setProcessing(true);
    setError("");

    try {
      const fd = new FormData();
      fd.append("file", upload.file);
      fd.append("scale", String(scale));
      if (outputFormat !== "same") fd.append("outputFormat", outputFormat);

      const res = await fetch("/api/tools/upscale", { method: "POST", body: fd });

      if (!res.ok) {
        const data = await res.json();
        if (data.code === "RATE_LIMIT") { setShowUpgrade(true); return; }
        setError(data.error || "Upscale failed");
        return;
      }

      const blob = await res.blob();
      const disp = res.headers.get("Content-Disposition") || "";
      const match = disp.match(/filename="(.+?)"/);
      const name = match?.[1] || upload.file.name.replace(/\.[^.]+$/, `-upscaled-${scale}x.jpg`);

      const origW = parseInt(res.headers.get("X-Original-Width") || "0") || upload.width;
      const origH = parseInt(res.headers.get("X-Original-Height") || "0") || upload.height;
      const newW  = parseInt(res.headers.get("X-New-Width") || "0") || upload.width * scale;
      const newH  = parseInt(res.headers.get("X-New-Height") || "0") || upload.height * scale;

      setResults((r) => [
        { name, url: URL.createObjectURL(blob), originalWidth: origW, originalHeight: origH, newWidth: newW, newHeight: newH, originalSize: upload.file.size, newSize: blob.size },
        ...r.filter((x) => x.name !== name),
      ]);
    } catch {
      setError("Upscale failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  }, [scale, outputFormat]);

  const onDrop = useCallback(async (files: File[]) => {
    const file = files[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      setError("File exceeds 20 MB limit.");
      return;
    }

    setError("");
    try {
      const upload = await loadImageDimensions(file);
      setUploaded(upload);
    } catch {
      setError("Could not read image. Please try a different file.");
    }
  }, [loadImageDimensions]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/jpeg": [], "image/png": [], "image/webp": [] },
    maxFiles: 1,
    maxSize: 20 * 1024 * 1024,
  });

  const clearUploaded = () => {
    if (uploaded) URL.revokeObjectURL(uploaded.previewUrl);
    setUploaded(null);
  };

  const removeResult = (name: string) => {
    setResults((r) => {
      const item = r.find((x) => x.name === name);
      if (item) URL.revokeObjectURL(item.url);
      return r.filter((x) => x.name !== name);
    });
  };

  const estimatedWidth  = uploaded ? Math.min(uploaded.width * scale, 8192) : 0;
  const estimatedHeight = uploaded ? Math.min(uploaded.height * scale, 8192) : 0;

  return (
    <div className="min-h-screen bg-background py-10">
      <div className="max-w-3xl mx-auto px-4 space-y-8">
        {/* Hero */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 bg-primary-light text-primary text-xs font-bold px-3 py-1 rounded-full mb-2">
            <Maximize2 size={12} /> UPSCALE IMAGE
          </div>
          <h1 className="text-3xl font-extrabold text-foreground">Upscale Images Online</h1>
          <p className="text-muted max-w-md mx-auto text-sm">
            Enlarge images 2x or 4x using Lanczos3 resampling. Maintain sharpness while increasing resolution.
          </p>
        </div>

        {/* Controls */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
          {/* Scale options */}
          <div>
            <p className="text-xs font-bold text-muted uppercase tracking-wider mb-2">Scale Factor</p>
            <div className="grid grid-cols-2 gap-2">
              {([2, 4] as const).map((s) => (
                <button key={s} onClick={() => setScale(s)}
                  className={`p-2 rounded-xl border text-center transition-all ${
                    scale === s
                      ? "border-primary bg-primary-light"
                      : "border-border hover:border-primary/40"
                  }`}>
                  <div className={`text-xs font-bold ${scale === s ? "text-primary" : "text-foreground"}`}>
                    {s}x Upscale
                  </div>
                  <div className="text-[10px] text-muted">
                    {s === 2 ? "Double resolution" : "Quadruple resolution"}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Output format */}
          <div>
            <label className="text-xs font-semibold text-muted block mb-1">Output format</label>
            <select value={outputFormat} onChange={(e) => setOutputFormat(e.target.value)}
              className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-card">
              <option value="same">Same as input</option>
              <option value="jpg">JPG</option>
              <option value="png">PNG</option>
              <option value="webp">WEBP</option>
            </select>
          </div>
        </div>

        {/* Uploaded file preview */}
        {uploaded && (
          <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={uploaded.previewUrl} alt={uploaded.file.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{uploaded.file.name}</p>
                <p className="text-xs text-muted mt-0.5">{fmtBytes(uploaded.file.size)}</p>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted">
                  <span>{uploaded.width} x {uploaded.height}</span>
                  <ArrowRight size={12} className="text-primary" />
                  <span className="text-primary font-semibold">{estimatedWidth} x {estimatedHeight}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => upscaleFile(uploaded)} disabled={processing}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50">
                  {processing ? <Loader2 size={13} className="animate-spin" /> : <Maximize2 size={13} />}
                  {processing ? "Upscaling..." : "Upscale"}
                </button>
                <button onClick={clearUploaded}
                  className="p-1.5 text-muted hover:text-red-500 transition-colors">
                  <X size={14} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Drop zone */}
        <div {...getRootProps()} className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
          isDragActive ? "border-primary bg-primary-light" : "border-border hover:border-primary/60 hover:bg-primary-light/30"
        }`}>
          <input {...getInputProps()} />
          <Upload size={32} className={`mx-auto mb-3 ${isDragActive ? "text-primary" : "text-muted"}`} />
          <p className="font-semibold text-foreground">
            {isDragActive ? "Drop image here" : "Drag & drop image or click to browse"}
          </p>
          <p className="text-xs text-muted mt-1">JPG, PNG, WEBP · Max 20 MB</p>
        </div>

        {/* Processing */}
        {processing && (
          <div className="flex items-center gap-2 text-sm text-muted">
            <Loader2 size={16} className="animate-spin text-primary" /> Upscaling image...
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-foreground">Results</h2>
            {results.map((r) => (
              <div key={r.name} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={r.url} alt={r.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{r.name}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted">
                    <span>{r.originalWidth}x{r.originalHeight}</span>
                    <ArrowRight size={10} className="text-primary" />
                    <span className="text-primary font-semibold">{r.newWidth}x{r.newHeight}</span>
                  </div>
                  <p className="text-xs text-muted mt-0.5">{fmtBytes(r.originalSize)} → {fmtBytes(r.newSize)}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <a href={r.url} download={r.name}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary-hover transition-colors">
                    <Download size={13} /> Download
                  </a>
                  <button onClick={() => removeResult(r.name)}
                    className="p-1.5 text-muted hover:text-red-500 transition-colors">
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Maximize2 size={16} className="text-primary" />
            <h3 className="text-sm font-bold text-foreground">How upscaling works</h3>
          </div>
          <p className="text-sm text-muted leading-relaxed">
            Your image is enlarged server-side using Lanczos3 resampling via Sharp (libvips). A mild sharpening pass
            is applied to preserve detail at the new resolution. Maximum output is 8192 x 8192 pixels. Files are
            never stored on our servers.
          </p>
        </div>

        {/* Related Tools */}
        <div>
          <h3 className="text-sm font-bold text-muted uppercase tracking-wider mb-3">Related Tools</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { href: "/tools/compress",       icon: Minimize2, label: "Compress" },
              { href: "/tools/crop",           icon: Crop,      label: "Crop" },
              { href: "/tools/photo-editor",   icon: Wand2,     label: "Photo Editor" },
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
