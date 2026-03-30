"use client";

import { useState, useCallback, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { Minimize2, Upload, Download, X, CheckCircle2, AlertCircle, Loader2, Zap, Package, Maximize2, Crop, Wand2 } from "lucide-react";
import Link from "next/link";
import JSZip from "jszip";
import UpgradeModal from "@/app/components/UpgradeModal";

type Preset = "low" | "medium" | "high" | "lossless";
const PRESETS: { key: Preset; label: string; quality: number; desc: string }[] = [
  { key: "low",      label: "Small",    quality: 40,  desc: "Smallest file" },
  { key: "medium",   label: "Balanced", quality: 72,  desc: "Best balance" },
  { key: "high",     label: "High",     quality: 88,  desc: "Better quality" },
  { key: "lossless", label: "Max",      quality: 100, desc: "No quality loss" },
];

interface Result {
  name: string;
  originalSize: number;
  compressedSize: number;
  url: string;
  ext: string;
}

function fmtBytes(n: number) {
  if (n < 1024) return n + " B";
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + " KB";
  return (n / (1024 * 1024)).toFixed(2) + " MB";
}

export default function CompressPage() {
  const [quality, setQuality]         = useState(72);
  const [preset, setPreset]           = useState<Preset>("medium");
  const [results, setResults]         = useState<Result[]>([]);
  const [processing, setProcessing]   = useState<string[]>([]);
  const [errors, setErrors]           = useState<Record<string, string>>({});
  const [showUpgrade, setShowUpgrade] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const handleQualityChange = (q: number) => {
    setQuality(q);
    const closest = PRESETS.reduce((a, b) =>
      Math.abs(b.quality - q) < Math.abs(a.quality - q) ? b : a
    );
    setPreset(closest.key);
  };

  const setPresetQuality = (p: Preset) => {
    setPreset(p);
    setQuality(PRESETS.find((x) => x.key === p)!.quality);
  };

  const compressFile = useCallback(async (file: File) => {
    const key = file.name + file.size;
    setProcessing((p) => [...p, key]);
    setErrors((e) => { const n = { ...e }; delete n[key]; return n; });

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("quality", String(quality));

      abortRef.current = new AbortController();
      const res = await fetch("/api/tools/compress", {
        method: "POST",
        body: fd,
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const data = await res.json();
        if (data.code === "RATE_LIMIT") { setShowUpgrade(true); return; }
        setErrors((e) => ({ ...e, [key]: data.error || "Compression failed" }));
        return;
      }

      const blob = res.blob ? await res.blob() : new Blob([await res.arrayBuffer()]);
      const origSize = parseInt(res.headers.get("X-Original-Size") || "0") || file.size;
      const compSize = parseInt(res.headers.get("X-Compressed-Size") || "0") || blob.size;
      const disp     = res.headers.get("Content-Disposition") || "";
      const match    = disp.match(/filename="(.+?)"/);
      const name     = match?.[1] || file.name;
      const ext      = name.split(".").pop() || "jpg";

      setResults((r) => [
        { name, originalSize: origSize, compressedSize: compSize, url: URL.createObjectURL(blob), ext },
        ...r.filter((x) => x.name !== name),
      ]);
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setErrors((e) => ({ ...e, [key]: "Compression failed" }));
      }
    } finally {
      setProcessing((p) => p.filter((x) => x !== key));
    }
  }, [quality]);

  const onDrop = useCallback((files: File[]) => {
    files.forEach(compressFile);
  }, [compressFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    maxSize: 50 * 1024 * 1024,
  });

  const removeResult = (name: string) => {
    setResults((r) => {
      const item = r.find((x) => x.name === name);
      if (item) URL.revokeObjectURL(item.url);
      return r.filter((x) => x.name !== name);
    });
  };

  return (
    <div className="min-h-screen bg-background py-10">
      <div className="max-w-3xl mx-auto px-4 space-y-8">
        {/* Hero */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 bg-primary-light text-primary text-xs font-bold px-3 py-1 rounded-full mb-2">
            <Minimize2 size={12} /> COMPRESS IMAGE
          </div>
          <h1 className="text-3xl font-extrabold text-foreground">Compress Images Online</h1>
          <p className="text-muted max-w-md mx-auto text-sm">
            Reduce file size while preserving quality. Supports JPG, PNG, WEBP, and AVIF.
          </p>
        </div>

        {/* Quality controls */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-foreground">Quality</span>
              <span className="text-sm font-bold text-primary">{quality}%</span>
            </div>
            <input
              type="range" min={1} max={100} value={quality}
              onChange={(e) => handleQualityChange(Number(e.target.value))}
              className="custom-range w-full"
            />
            <div className="flex justify-between text-[10px] text-muted mt-1">
              <span>Smallest</span><span>Best quality</span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {PRESETS.map((p) => (
              <button key={p.key} onClick={() => setPresetQuality(p.key)}
                className={`p-2 rounded-xl border text-center transition-all ${
                  preset === p.key
                    ? "border-primary bg-primary-light"
                    : "border-border hover:border-primary/40"
                }`}>
                <div className={`text-xs font-bold ${preset === p.key ? "text-primary" : "text-foreground"}`}>
                  {p.label}
                </div>
                <div className="text-[10px] text-muted">{p.quality}%</div>
              </button>
            ))}
          </div>
        </div>

        {/* Drop zone */}
        <div {...getRootProps()} className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
          isDragActive ? "border-primary bg-primary-light" : "border-border hover:border-primary/60 hover:bg-primary-light/30"
        }`}>
          <input {...getInputProps()} />
          <Upload size={32} className={`mx-auto mb-3 ${isDragActive ? "text-primary" : "text-muted"}`} />
          <p className="font-semibold text-foreground">
            {isDragActive ? "Drop files here" : "Drag & drop images or click to browse"}
          </p>
          <p className="text-xs text-muted mt-1">JPG, PNG, WEBP, AVIF · Up to 10 MB free / 50 MB Pro</p>
        </div>

        {/* Processing */}
        {processing.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted">
            <Loader2 size={16} className="animate-spin text-primary" />
            Compressing {processing.length} file{processing.length > 1 ? "s" : ""}…
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-foreground">Results ({results.length})</h2>
              {results.length > 1 && (
                <button
                  onClick={async () => {
                    const zip = new JSZip();
                    for (const r of results) {
                      const resp = await fetch(r.url);
                      const blob = await resp.blob();
                      zip.file(r.name, blob);
                    }
                    const content = await zip.generateAsync({ type: "blob" });
                    const url = URL.createObjectURL(content);
                    const a = document.createElement("a");
                    a.href = url; a.download = "compressed-images.zip"; a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-primary border border-primary/30 rounded-lg hover:bg-primary-light transition-colors"
                >
                  <Package size={13} /> Download All ZIP
                </button>
              )}
            </div>
            {results.map((r) => {
              const savings = r.originalSize - r.compressedSize;
              const pct     = ((savings / r.originalSize) * 100).toFixed(1);
              return (
                <div key={r.name} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={r.url} alt={r.name} className="w-full h-full object-cover" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{r.name}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted">
                      <span>{fmtBytes(r.originalSize)}</span>
                      <span>→</span>
                      <span className="text-green-600 font-semibold">{fmtBytes(r.compressedSize)}</span>
                    </div>
                    {savings > 0 && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <CheckCircle2 size={12} className="text-green-500" />
                        <span className="text-[11px] font-bold text-green-600">{pct}% saved ({fmtBytes(savings)})</span>
                      </div>
                    )}
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
              );
            })}
          </div>
        )}

        {/* Errors */}
        {Object.entries(errors).map(([k, msg]) => (
          <div key={k} className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <AlertCircle size={16} />
            {msg}
          </div>
        ))}

        {/* Info */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-primary" />
            <h3 className="text-sm font-bold text-foreground">How compression works</h3>
          </div>
          <p className="text-sm text-muted leading-relaxed">
            Your images are compressed server-side using libvips (via Sharp). We apply format-specific
            optimisation: mozjpeg for JPEG, pngquant-style quantisation for PNG, and Google&apos;s encoder for WEBP.
            Files are never stored on our servers.
          </p>
        </div>

        {/* Related Tools */}
        <div>
          <h3 className="text-sm font-bold text-muted uppercase tracking-wider mb-3">Related Tools</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { href: "/tools/resize",         icon: Maximize2, label: "Resize Image" },
              { href: "/tools/crop",           icon: Crop,      label: "Crop Image" },
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
