"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Maximize2, Upload, Download, X, Loader2, Lock, Unlock, Minimize2, Crop, Wand2 } from "lucide-react";
import Link from "next/link";
import UpgradeModal from "@/app/components/UpgradeModal";

const PRESETS = [
  { label: "HD 1280×720",        w: 1280, h: 720  },
  { label: "Full HD 1920×1080",  w: 1920, h: 1080 },
  { label: "Twitter Post",       w: 1200, h: 675  },
  { label: "Instagram Square",   w: 1080, h: 1080 },
  { label: "Instagram Story",    w: 1080, h: 1920 },
  { label: "Facebook Cover",     w: 851,  h: 315  },
  { label: "LinkedIn Banner",    w: 1584, h: 396  },
  { label: "Favicon 32×32",      w: 32,   h: 32   },
  { label: "App Icon 512×512",   w: 512,  h: 512  },
];

const FIT_MODES = [
  { value: "inside",   label: "Fit inside" },
  { value: "cover",    label: "Cover (crop)" },
  { value: "contain",  label: "Contain (pad)" },
  { value: "fill",     label: "Stretch" },
];

interface Result { name: string; url: string; originalSize: number; newSize: number }

function fmtBytes(n: number) {
  if (n < 1024) return n + " B";
  if (n < 1048576) return (n / 1024).toFixed(1) + " KB";
  return (n / 1048576).toFixed(2) + " MB";
}

export default function ResizePage() {
  const [width,       setWidth]       = useState("");
  const [height,      setHeight]      = useState("");
  const [fit,         setFit]         = useState("inside");
  const [locked,      setLocked]      = useState(true);
  const [bgColor,     setBgColor]     = useState("#ffffff");
  const [outputFmt,   setOutputFmt]   = useState("same");
  const [results,     setResults]     = useState<Result[]>([]);
  const [processing,  setProcessing]  = useState(false);
  const [error,       setError]       = useState("");
  const [showUpgrade, setShowUpgrade] = useState(false);

  const applyPreset = (w: number, h: number) => {
    setWidth(String(w));
    setHeight(String(h));
  };

  const resizeFile = useCallback(async (file: File) => {
    if (!width && !height) { setError("Enter width or height."); return; }
    setProcessing(true);
    setError("");

    try {
      const fd = new FormData();
      fd.append("file", file);
      if (width)  fd.append("width",  width);
      if (height) fd.append("height", height);
      fd.append("fit", fit);
      fd.append("background", bgColor);
      if (outputFmt !== "same") fd.append("outputFormat", outputFmt);

      const res = await fetch("/api/tools/resize", { method: "POST", body: fd });
      if (!res.ok) {
        const data = await res.json();
        if (data.code === "RATE_LIMIT") { setShowUpgrade(true); return; }
        setError(data.error || "Resize failed");
        return;
      }

      const blob = await res.blob();
      const disp = res.headers.get("Content-Disposition") || "";
      const match = disp.match(/filename="(.+?)"/);
      const name  = match?.[1] || file.name.replace(/\.[^.]+$/, "-resized.jpg");

      setResults((r) => [
        { name, url: URL.createObjectURL(blob), originalSize: file.size, newSize: blob.size },
        ...r.filter((x) => x.name !== name),
      ]);
    } catch {
      setError("Resize failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  }, [width, height, fit, bgColor, outputFmt]);

  const onDrop = useCallback((files: File[]) => {
    files.slice(0, 1).forEach(resizeFile);
  }, [resizeFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    maxFiles: 1,
  });

  return (
    <div className="min-h-screen bg-background py-10">
      <div className="max-w-3xl mx-auto px-4 space-y-8">
        {/* Hero */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 bg-primary-light text-primary text-xs font-bold px-3 py-1 rounded-full mb-2">
            <Maximize2 size={12} /> RESIZE IMAGE
          </div>
          <h1 className="text-3xl font-extrabold text-foreground">Resize Images Online</h1>
          <p className="text-muted max-w-md mx-auto text-sm">
            Change image dimensions to any size. Choose from social media presets or enter custom values.
          </p>
        </div>

        {/* Controls */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
          {/* Presets */}
          <div>
            <p className="text-xs font-bold text-muted uppercase tracking-wider mb-2">Presets</p>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button key={p.label} onClick={() => applyPreset(p.w, p.h)}
                  className="px-2.5 py-1 border border-border rounded-lg text-xs font-medium text-foreground hover:border-primary hover:text-primary transition-colors">
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dimensions */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="text-xs font-semibold text-muted block mb-1">Width (px)</label>
              <input type="number" value={width} onChange={(e) => setWidth(e.target.value)} placeholder="e.g. 1920"
                className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <button onClick={() => setLocked((l) => !l)}
              className="mt-5 p-2 rounded-xl border border-border hover:border-primary text-muted hover:text-primary transition-colors">
              {locked ? <Lock size={16} /> : <Unlock size={16} />}
            </button>
            <div className="flex-1">
              <label className="text-xs font-semibold text-muted block mb-1">Height (px)</label>
              <input type="number" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="e.g. 1080"
                className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>

          {/* Fit + format */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-muted block mb-1">Fit mode</label>
              <select value={fit} onChange={(e) => setFit(e.target.value)}
                className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-card">
                {FIT_MODES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted block mb-1">Output format</label>
              <select value={outputFmt} onChange={(e) => setOutputFmt(e.target.value)}
                className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-card">
                <option value="same">Same as input</option>
                <option value="jpg">JPG</option>
                <option value="png">PNG</option>
                <option value="webp">WEBP</option>
              </select>
            </div>
          </div>

          {(fit === "contain" || fit === "fill") && (
            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-muted">Background color</label>
              <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)}
                className="w-8 h-8 rounded-lg border border-border cursor-pointer" />
              <span className="text-xs text-muted font-mono">{bgColor}</span>
            </div>
          )}
        </div>

        {/* Drop zone */}
        <div {...getRootProps()} className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
          isDragActive ? "border-primary bg-primary-light" : "border-border hover:border-primary/60 hover:bg-primary-light/30"
        }`}>
          <input {...getInputProps()} />
          <Upload size={32} className={`mx-auto mb-3 ${isDragActive ? "text-primary" : "text-muted"}`} />
          <p className="font-semibold text-foreground">
            {isDragActive ? "Drop image here" : "Drag & drop image or click to browse"}
          </p>
          <p className="text-xs text-muted mt-1">One image at a time · JPG, PNG, WEBP, GIF</p>
        </div>

        {processing && (
          <div className="flex items-center gap-2 text-sm text-muted">
            <Loader2 size={16} className="animate-spin text-primary" /> Resizing…
          </div>
        )}

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</div>
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
                  <p className="text-xs text-muted mt-0.5">{fmtBytes(r.originalSize)} → {fmtBytes(r.newSize)}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <a href={r.url} download={r.name}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary-hover transition-colors">
                    <Download size={13} /> Download
                  </a>
                  <button onClick={() => setResults((x) => x.filter((i) => i.name !== r.name))}
                    className="p-1.5 text-muted hover:text-red-500 transition-colors">
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

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
