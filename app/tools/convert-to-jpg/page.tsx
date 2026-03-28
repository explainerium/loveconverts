"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { FileImage, Upload, Download, X, Loader2, CheckCircle2, Package, Minimize2, Maximize2, Wand2 } from "lucide-react";
import Link from "next/link";
import JSZip from "jszip";
import UpgradeModal from "@/app/components/UpgradeModal";

interface Result {
  name: string;
  url: string;
  originalSize: number;
  newSize: number;
}

function fmtBytes(n: number) {
  if (n < 1024) return n + " B";
  if (n < 1048576) return (n / 1024).toFixed(1) + " KB";
  return (n / 1048576).toFixed(2) + " MB";
}

export default function ConvertToJpgPage() {
  const [quality,     setQuality]     = useState(90);
  const [bgColor,     setBgColor]     = useState("#ffffff");
  const [results,     setResults]     = useState<Result[]>([]);
  const [processing,  setProcessing]  = useState<string[]>([]);
  const [errors,      setErrors]      = useState<Record<string, string>>({});
  const [showUpgrade, setShowUpgrade] = useState(false);

  const convertFile = useCallback(async (file: File) => {
    const key = file.name + file.size;
    setProcessing((p) => [...p, key]);
    setErrors((e) => { const n = { ...e }; delete n[key]; return n; });

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("quality", String(quality));
      fd.append("background", bgColor);

      const res = await fetch("/api/tools/convert-to-jpg", { method: "POST", body: fd });
      if (!res.ok) {
        const data = await res.json();
        if (data.code === "RATE_LIMIT") { setShowUpgrade(true); return; }
        setErrors((e) => ({ ...e, [key]: data.error || "Conversion failed" }));
        return;
      }

      const blob = await res.blob();
      const origSize = parseInt(res.headers.get("X-Original-Size") || "0") || file.size;
      const newSize  = parseInt(res.headers.get("X-Output-Size")   || "0") || blob.size;
      const disp     = res.headers.get("Content-Disposition") || "";
      const match    = disp.match(/filename="(.+?)"/);
      const name     = match?.[1] || file.name.replace(/\.[^.]+$/, ".jpg");

      setResults((r) => [
        { name, url: URL.createObjectURL(blob), originalSize: origSize, newSize },
        ...r.filter((x) => x.name !== name),
      ]);
    } catch {
      setErrors((e) => ({ ...e, [key]: "Conversion failed" }));
    } finally {
      setProcessing((p) => p.filter((x) => x !== key));
    }
  }, [quality, bgColor]);

  const onDrop = useCallback((files: File[]) => {
    files.forEach(convertFile);
  }, [convertFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
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
            <FileImage size={12} /> CONVERT TO JPG
          </div>
          <h1 className="text-3xl font-extrabold text-foreground">Convert Images to JPG</h1>
          <p className="text-muted max-w-md mx-auto text-sm">
            Convert PNG, WEBP, AVIF, GIF, BMP, and more to JPG format in one click.
          </p>
        </div>

        {/* Options */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-foreground">JPEG Quality</span>
              <span className="text-sm font-bold text-primary">{quality}%</span>
            </div>
            <input
              type="range" min={1} max={100} value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
              className="custom-range w-full"
            />
            <div className="flex justify-between text-[10px] text-muted mt-1">
              <span>Smallest file</span><span>Best quality</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold text-muted">Background color</label>
            <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)}
              className="w-8 h-8 rounded-lg border border-border cursor-pointer" />
            <span className="text-xs text-muted font-mono">{bgColor}</span>
            <span className="text-xs text-muted">(replaces transparency)</span>
          </div>
        </div>

        {/* Drop zone */}
        <div {...getRootProps()} className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
          isDragActive ? "border-primary bg-primary-light" : "border-border hover:border-primary/60 hover:bg-primary-light/30"
        }`}>
          <input {...getInputProps()} />
          <Upload size={32} className={`mx-auto mb-3 ${isDragActive ? "text-primary" : "text-muted"}`} />
          <p className="font-semibold text-foreground">
            {isDragActive ? "Drop images here" : "Drag & drop images or click to browse"}
          </p>
          <p className="text-xs text-muted mt-1">PNG, WEBP, AVIF, GIF, BMP, TIFF → JPG</p>
        </div>

        {/* Processing */}
        {processing.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted">
            <Loader2 size={16} className="animate-spin text-primary" />
            Converting {processing.length} file{processing.length > 1 ? "s" : ""}…
          </div>
        )}

        {/* Errors */}
        {Object.entries(errors).map(([k, msg]) => (
          <div key={k} className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{msg}</div>
        ))}

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-foreground">Converted Files ({results.length})</h2>
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
                    a.href = url; a.download = "converted-to-jpg.zip"; a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-primary border border-primary/30 rounded-lg hover:bg-primary-light transition-colors"
                >
                  <Package size={13} /> Download All ZIP
                </button>
              )}
            </div>
            {results.map((r) => (
              <div key={r.name} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={r.url} alt={r.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{r.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <CheckCircle2 size={12} className="text-green-500" />
                    <span className="text-xs text-muted">{fmtBytes(r.originalSize)} → <span className="text-green-600 font-semibold">{fmtBytes(r.newSize)}</span></span>
                    <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-full">JPG</span>
                  </div>
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

        {/* Why JPG */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="text-sm font-bold text-foreground mb-2">Why convert to JPG?</h3>
          <p className="text-sm text-muted leading-relaxed">
            JPG (JPEG) is the most universally supported image format. It offers excellent compression with
            very small file sizes — perfect for photos, email attachments, web pages, and anywhere you need
            broad compatibility. Transparency is replaced with a solid background color during conversion.
          </p>
        </div>

        {/* Related Tools */}
        <div>
          <h3 className="text-sm font-bold text-muted uppercase tracking-wider mb-3">Related Tools</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { href: "/tools/compress",       icon: Minimize2, label: "Compress" },
              { href: "/tools/resize",         icon: Maximize2, label: "Resize" },
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
