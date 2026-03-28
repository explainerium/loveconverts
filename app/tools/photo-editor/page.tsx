"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { Wand2, Upload, Download, Loader2, RefreshCw, RotateCw, Minimize2, Maximize2, Crop } from "lucide-react";
import Link from "next/link";
import UpgradeModal from "@/app/components/UpgradeModal";

interface Adjustments {
  brightness: number;
  contrast: number;
  saturation: number;
  hue: number;
  sharpness: number;
  blur: number;
  grayscale: boolean;
  sepia: boolean;
  rotate: 0 | 90 | 180 | 270;
  flip: boolean;
  flop: boolean;
  quality: number;
  outputFormat: string;
}

const DEFAULT: Adjustments = {
  brightness: 0, contrast: 0, saturation: 0, hue: 0,
  sharpness: 0, blur: 0, grayscale: false, sepia: false,
  rotate: 0, flip: false, flop: false, quality: 90, outputFormat: "jpg",
};

type SliderKey = "brightness" | "contrast" | "saturation" | "hue" | "sharpness" | "blur";

const SLIDERS: { key: SliderKey; label: string; min: number; max: number; step: number }[] = [
  { key: "brightness", label: "Brightness", min: -100, max: 100, step: 1 },
  { key: "contrast",   label: "Contrast",   min: -100, max: 100, step: 1 },
  { key: "saturation", label: "Saturation", min: -100, max: 100, step: 1 },
  { key: "hue",        label: "Hue",        min: -180, max: 180, step: 1 },
  { key: "sharpness",  label: "Sharpen",    min: 0,    max: 100, step: 1 },
  { key: "blur",       label: "Blur",       min: 0,    max: 20,  step: 0.5 },
];

export default function PhotoEditorPage() {
  const [file,        setFile]        = useState<File | null>(null);
  const [imgSrc,      setImgSrc]      = useState("");
  const [adj,         setAdj]         = useState<Adjustments>(DEFAULT);
  const [previewUrl,  setPreviewUrl]  = useState("");
  const [previewLoading, setPLoading] = useState(false);
  const [processing,  setProcessing]  = useState(false);
  const [resultUrl,   setResultUrl]   = useState("");
  const [resultName,  setResultName]  = useState("");
  const [error,       setError]       = useState("");
  const [showUpgrade, setShowUpgrade] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevUrlRef  = useRef("");

  const set = <K extends keyof Adjustments>(key: K, val: Adjustments[K]) =>
    setAdj((a) => ({ ...a, [key]: val }));

  const buildFormData = useCallback((f: File, preview: boolean, a: Adjustments) => {
    const fd = new FormData();
    fd.append("file", f);
    fd.append("preview", preview ? "true" : "false");
    Object.entries(a).forEach(([k, v]) => fd.append(k, String(v)));
    return fd;
  }, []);

  // Debounced preview fetch
  useEffect(() => {
    if (!file) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setPLoading(true);
      try {
        const res = await fetch("/api/tools/photo-editor", {
          method: "POST",
          body: buildFormData(file, true, adj),
        });
        if (!res.ok) return;
        const blob = await res.blob();
        const url  = URL.createObjectURL(blob);
        if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current);
        prevUrlRef.current = url;
        setPreviewUrl(url);
      } catch { /* silent */ } finally {
        setPLoading(false);
      }
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [file, adj, buildFormData]);

  const onDrop = useCallback((files: File[]) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setResultUrl("");
    setAdj(DEFAULT);
    const reader = new FileReader();
    reader.onload = () => setImgSrc(reader.result as string);
    reader.readAsDataURL(f);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { "image/*": [] }, maxFiles: 1,
  });

  const handleSave = async () => {
    if (!file) return;
    setProcessing(true);
    setError("");
    try {
      const res = await fetch("/api/tools/photo-editor", {
        method: "POST",
        body: buildFormData(file, false, adj),
      });
      if (!res.ok) {
        const data = await res.json();
        if (data.code === "RATE_LIMIT") { setShowUpgrade(true); return; }
        setError(data.error || "Edit failed");
        return;
      }
      const blob = await res.blob();
      const base = file.name.replace(/\.[^.]+$/, "");
      const name = `${base}-edited.${adj.outputFormat}`;
      setResultUrl(URL.createObjectURL(blob));
      setResultName(name);
    } catch {
      setError("Edit failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const handleRotate = () => {
    const steps: (0 | 90 | 180 | 270)[] = [0, 90, 180, 270];
    const idx = steps.indexOf(adj.rotate);
    set("rotate", steps[(idx + 1) % 4]);
  };

  return (
    <div className="min-h-screen bg-background py-10">
      <div className="max-w-5xl mx-auto px-4 space-y-8">
        {/* Hero */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 bg-primary-light text-primary text-xs font-bold px-3 py-1 rounded-full mb-2">
            <Wand2 size={12} /> PHOTO EDITOR
          </div>
          <h1 className="text-3xl font-extrabold text-foreground">Edit Photos Online</h1>
          <p className="text-muted max-w-md mx-auto text-sm">
            Adjust brightness, contrast, saturation, and more. Real-time preview included.
          </p>
        </div>

        {!file ? (
          <div {...getRootProps()} className={`border-2 border-dashed rounded-2xl p-14 text-center cursor-pointer transition-all ${
            isDragActive ? "border-primary bg-primary-light" : "border-border hover:border-primary/60 hover:bg-primary-light/30"
          }`}>
            <input {...getInputProps()} />
            <Upload size={36} className={`mx-auto mb-3 ${isDragActive ? "text-primary" : "text-muted"}`} />
            <p className="font-semibold text-foreground">
              {isDragActive ? "Drop image here" : "Drag & drop or click to open image"}
            </p>
            <p className="text-xs text-muted mt-1">JPG, PNG, WEBP, AVIF</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-[1fr_320px] gap-6">
            {/* Preview pane */}
            <div className="bg-card border border-border rounded-2xl p-4 flex flex-col items-center justify-center min-h-[360px] relative">
              {previewLoading && (
                <div className="absolute top-3 right-3">
                  <Loader2 size={16} className="animate-spin text-primary" />
                </div>
              )}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl || imgSrc}
                alt="Preview"
                className="max-w-full max-h-[500px] object-contain rounded-xl transition-opacity"
                style={{ opacity: previewLoading ? 0.7 : 1 }}
              />
              <p className="text-[11px] text-muted mt-2">Live preview</p>
            </div>

            {/* Controls */}
            <div className="space-y-4">
              {/* Sliders */}
              <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
                {SLIDERS.map(({ key, label, min, max, step }) => (
                  <div key={key}>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs font-semibold text-foreground">{label}</span>
                      <span className="text-xs font-bold text-primary">{adj[key]}</span>
                    </div>
                    <input
                      type="range" min={min} max={max} step={step}
                      value={adj[key] as number}
                      onChange={(e) => set(key, Number(e.target.value))}
                      className="custom-range w-full"
                    />
                  </div>
                ))}
              </div>

              {/* Filters + transforms */}
              <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
                <p className="text-xs font-bold text-muted uppercase tracking-wider">Filters</p>
                <div className="flex gap-2">
                  <button onClick={() => set("grayscale", !adj.grayscale)}
                    className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-all ${
                      adj.grayscale ? "border-primary bg-primary-light text-primary" : "border-border text-muted hover:border-primary/40"
                    }`}>
                    B&amp;W
                  </button>
                  <button onClick={() => set("sepia", !adj.sepia)}
                    className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-all ${
                      adj.sepia ? "border-amber-400 bg-amber-50 text-amber-700" : "border-border text-muted hover:border-amber-300"
                    }`}>
                    Sepia
                  </button>
                </div>

                <p className="text-xs font-bold text-muted uppercase tracking-wider pt-1">Transform</p>
                <div className="flex gap-2">
                  <button onClick={handleRotate}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-border text-xs font-bold text-muted hover:border-primary/40 hover:text-foreground transition-all">
                    <RotateCw size={12} /> Rotate {adj.rotate}°
                  </button>
                  <button onClick={() => set("flip", !adj.flip)}
                    className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-all ${
                      adj.flip ? "border-primary bg-primary-light text-primary" : "border-border text-muted hover:border-primary/40"
                    }`}>
                    Flip ↕
                  </button>
                  <button onClick={() => set("flop", !adj.flop)}
                    className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-all ${
                      adj.flop ? "border-primary bg-primary-light text-primary" : "border-border text-muted hover:border-primary/40"
                    }`}>
                    Flop ↔
                  </button>
                </div>
              </div>

              {/* Output */}
              <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
                <p className="text-xs font-bold text-muted uppercase tracking-wider">Output</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted block mb-1">Format</label>
                    <select value={adj.outputFormat} onChange={(e) => set("outputFormat", e.target.value)}
                      className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary/30">
                      <option value="jpg">JPG</option>
                      <option value="png">PNG</option>
                      <option value="webp">WEBP</option>
                      <option value="avif">AVIF</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted block mb-1">Quality</label>
                    <input type="number" min={1} max={100} value={adj.quality}
                      onChange={(e) => set("quality", Number(e.target.value))}
                      className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                </div>
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <button onClick={handleSave} disabled={processing}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary-hover transition-colors disabled:opacity-50">
                  {processing ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                  {processing ? "Saving…" : "Save Image"}
                </button>
                <button onClick={() => setAdj(DEFAULT)}
                  className="p-2.5 border border-border rounded-xl text-muted hover:text-foreground hover:border-foreground/30 transition-colors"
                  title="Reset all">
                  <RefreshCw size={16} />
                </button>
                <button
                  onClick={() => { setFile(null); setImgSrc(""); setPreviewUrl(""); setResultUrl(""); }}
                  className="px-3 py-2.5 border border-border rounded-xl text-xs font-semibold text-muted hover:text-foreground hover:border-foreground/30 transition-colors">
                  New
                </button>
              </div>

              {resultUrl && (
                <a href={resultUrl} download={resultName}
                  className="flex items-center justify-center gap-2 w-full py-2.5 border-2 border-green-400 bg-green-50 text-green-700 text-sm font-bold rounded-xl hover:bg-green-100 transition-colors">
                  <Download size={15} /> Download {resultName}
                </a>
              )}
            </div>
          </div>
        )}

        {/* Related Tools */}
        <div className="max-w-3xl mx-auto mt-8">
          <h3 className="text-sm font-bold text-muted uppercase tracking-wider mb-3">Related Tools</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { href: "/tools/compress",       icon: Minimize2, label: "Compress" },
              { href: "/tools/resize",         icon: Maximize2, label: "Resize" },
              { href: "/tools/crop",           icon: Crop,      label: "Crop" },
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

