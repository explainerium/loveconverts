"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import {
  Droplets,
  Upload,
  Download,
  X,
  Loader2,
  AlertCircle,
  Zap,
  Minimize2,
  Maximize2,
  Crop,
  Wand2,
} from "lucide-react";
import Link from "next/link";
import UpgradeModal from "@/app/components/UpgradeModal";

type Position = "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right" | "tiled";

const POSITIONS: { key: Position; label: string }[] = [
  { key: "center", label: "Center" },
  { key: "top-left", label: "Top Left" },
  { key: "top-right", label: "Top Right" },
  { key: "bottom-left", label: "Bottom Left" },
  { key: "bottom-right", label: "Bottom Right" },
  { key: "tiled", label: "Tiled" },
];

interface WatermarkResult {
  name: string;
  originalSize: number;
  watermarkedSize: number;
  url: string;
  ext: string;
}

function fmtBytes(n: number) {
  if (n < 1024) return n + " B";
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + " KB";
  return (n / (1024 * 1024)).toFixed(2) + " MB";
}

export default function WatermarkPage() {
  const [text, setText] = useState("Watermark");
  const [fontSize, setFontSize] = useState(32);
  const [opacity, setOpacity] = useState(50);
  const [color, setColor] = useState("#ffffff");
  const [position, setPosition] = useState<Position>("center");

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<WatermarkResult | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Generate preview when file or settings change
  useEffect(() => {
    if (!file || !preview) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const img = new Image();
    img.onload = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Scale canvas to fit within container while maintaining aspect ratio
      const maxW = 600;
      const maxH = 400;
      const scale = Math.min(maxW / img.width, maxH / img.height, 1);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);

      canvas.width = w;
      canvas.height = h;

      ctx.drawImage(img, 0, 0, w, h);

      // Draw watermark
      const scaledFontSize = Math.max(8, Math.round(fontSize * scale));
      ctx.font = `bold ${scaledFontSize}px Arial, Helvetica, sans-serif`;
      ctx.fillStyle = color;
      ctx.globalAlpha = opacity / 100;

      if (position === "tiled") {
        const metrics = ctx.measureText(text);
        const tileW = Math.max(metrics.width + 40, 120);
        const tileH = scaledFontSize * 2.5;
        const cols = Math.ceil(w / tileW) + 1;
        const rows = Math.ceil(h / tileH) + 1;

        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            const tx = col * tileW + (row % 2 === 1 ? tileW / 2 : 0);
            const ty = row * tileH + tileH / 2;
            ctx.save();
            ctx.translate(tx, ty);
            ctx.rotate((-30 * Math.PI) / 180);
            ctx.fillText(text, 0, 0);
            ctx.restore();
          }
        }
      } else {
        let tx: number;
        let ty: number;
        const pad = scaledFontSize;

        switch (position) {
          case "top-left":
            ctx.textAlign = "left";
            ctx.textBaseline = "top";
            tx = pad;
            ty = pad;
            break;
          case "top-right":
            ctx.textAlign = "right";
            ctx.textBaseline = "top";
            tx = w - pad;
            ty = pad;
            break;
          case "bottom-left":
            ctx.textAlign = "left";
            ctx.textBaseline = "bottom";
            tx = pad;
            ty = h - pad;
            break;
          case "bottom-right":
            ctx.textAlign = "right";
            ctx.textBaseline = "bottom";
            tx = w - pad;
            ty = h - pad;
            break;
          case "center":
          default:
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            tx = w / 2;
            ty = h / 2;
            break;
        }

        ctx.fillText(text, tx, ty);
      }

      ctx.globalAlpha = 1;
    };
    img.src = preview;
  }, [file, preview, text, fontSize, opacity, color, position]);

  const onDrop = useCallback((accepted: File[]) => {
    const f = accepted[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    setError(null);

    const url = URL.createObjectURL(f);
    setPreview(url);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [],
      "image/png": [],
      "image/webp": [],
    },
    maxSize: 20 * 1024 * 1024,
    multiple: false,
  });

  const removeFile = () => {
    if (preview) URL.revokeObjectURL(preview);
    if (result) URL.revokeObjectURL(result.url);
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
  };

  const applyWatermark = useCallback(async () => {
    if (!file) return;
    setProcessing(true);
    setError(null);

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("text", text);
      fd.append("fontSize", String(fontSize));
      fd.append("opacity", String(opacity));
      fd.append("color", color);
      fd.append("position", position);

      abortRef.current = new AbortController();
      const res = await fetch("/api/tools/watermark", {
        method: "POST",
        body: fd,
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const data = await res.json();
        if (data.code === "RATE_LIMIT") {
          setShowUpgrade(true);
          return;
        }
        setError(data.error || "Watermark processing failed");
        return;
      }

      const blob = res.blob ? await res.blob() : new Blob([await res.arrayBuffer()]);
      const origSize = parseInt(res.headers.get("X-Original-Size") || "0") || file.size;
      const wmSize = parseInt(res.headers.get("X-Watermarked-Size") || "0") || blob.size;
      const disp = res.headers.get("Content-Disposition") || "";
      const match = disp.match(/filename="(.+?)"/);
      const name = match?.[1] || file.name;
      const ext = name.split(".").pop() || "jpg";

      if (result) URL.revokeObjectURL(result.url);

      setResult({
        name,
        originalSize: origSize,
        watermarkedSize: wmSize,
        url: URL.createObjectURL(blob),
        ext,
      });
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setError("Watermark processing failed");
      }
    } finally {
      setProcessing(false);
    }
  }, [file, text, fontSize, opacity, color, position, result]);

  return (
    <div className="min-h-screen bg-background py-10">
      <div className="max-w-3xl mx-auto px-4 space-y-8">
        {/* Hero */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 bg-primary-light text-primary text-xs font-bold px-3 py-1 rounded-full mb-2">
            <Droplets size={12} /> ADD WATERMARK
          </div>
          <h1 className="text-3xl font-extrabold text-foreground">Add Watermark to Images</h1>
          <p className="text-muted max-w-md mx-auto text-sm">
            Protect your photos with text watermarks. Choose position, size, opacity, and color. Supports JPG, PNG, WEBP.
          </p>
        </div>

        {/* Watermark controls */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
          {/* Text input */}
          <div>
            <label htmlFor="wm-text" className="text-sm font-semibold text-foreground block mb-2">
              Watermark Text
            </label>
            <input
              id="wm-text"
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter watermark text"
              maxLength={100}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          {/* Font size */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-foreground">Font Size</span>
              <span className="text-sm font-bold text-primary">{fontSize}px</span>
            </div>
            <input
              type="range"
              min={12}
              max={120}
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="custom-range w-full"
            />
            <div className="flex justify-between text-[10px] text-muted mt-1">
              <span>12px</span>
              <span>120px</span>
            </div>
          </div>

          {/* Opacity */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-foreground">Opacity</span>
              <span className="text-sm font-bold text-primary">{opacity}%</span>
            </div>
            <input
              type="range"
              min={10}
              max={100}
              value={opacity}
              onChange={(e) => setOpacity(Number(e.target.value))}
              className="custom-range w-full"
            />
            <div className="flex justify-between text-[10px] text-muted mt-1">
              <span>Subtle</span>
              <span>Solid</span>
            </div>
          </div>

          {/* Color picker + Position select row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="wm-color" className="text-sm font-semibold text-foreground block mb-2">
                Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="wm-color"
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-10 h-10 rounded-lg border border-border cursor-pointer"
                />
                <span className="text-xs text-muted font-mono">{color}</span>
              </div>
            </div>

            <div>
              <label htmlFor="wm-position" className="text-sm font-semibold text-foreground block mb-2">
                Position
              </label>
              <select
                id="wm-position"
                value={position}
                onChange={(e) => setPosition(e.target.value as Position)}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                {POSITIONS.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Drop zone or preview */}
        {!file ? (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
              isDragActive
                ? "border-primary bg-primary-light"
                : "border-border hover:border-primary/60 hover:bg-primary-light/30"
            }`}
          >
            <input {...getInputProps()} />
            <Upload
              size={32}
              className={`mx-auto mb-3 ${isDragActive ? "text-primary" : "text-muted"}`}
            />
            <p className="font-semibold text-foreground">
              {isDragActive ? "Drop image here" : "Drag & drop an image or click to browse"}
            </p>
            <p className="text-xs text-muted mt-1">JPG, PNG, WEBP &middot; Up to 20 MB</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* File info bar */}
            <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{file.name}</p>
                <p className="text-xs text-muted">{fmtBytes(file.size)}</p>
              </div>
              <button
                onClick={removeFile}
                className="p-1.5 text-muted hover:text-red-500 transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            {/* Live preview canvas */}
            <div className="bg-card border border-border rounded-2xl p-4">
              <h3 className="text-sm font-bold text-foreground mb-3">Preview</h3>
              <div className="flex justify-center bg-gray-100 rounded-xl overflow-hidden">
                <canvas
                  ref={canvasRef}
                  className="max-w-full h-auto"
                  style={{ maxHeight: 400 }}
                />
              </div>
            </div>

            {/* Apply button */}
            <button
              onClick={applyWatermark}
              disabled={processing || !text.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Processing&hellip;
                </>
              ) : (
                <>
                  <Droplets size={16} /> Apply Watermark
                </>
              )}
            </button>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-foreground">Result</h2>
            <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={result.url} alt={result.name} className="w-full h-full object-cover" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{result.name}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted">
                  <span>{fmtBytes(result.originalSize)}</span>
                  <span>&rarr;</span>
                  <span>{fmtBytes(result.watermarkedSize)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <a
                  href={result.url}
                  download={result.name}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary-hover transition-colors"
                >
                  <Download size={13} /> Download
                </a>
                <button
                  onClick={() => {
                    URL.revokeObjectURL(result.url);
                    setResult(null);
                  }}
                  className="p-1.5 text-muted hover:text-red-500 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Info */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-primary" />
            <h3 className="text-sm font-bold text-foreground">How watermarking works</h3>
          </div>
          <p className="text-sm text-muted leading-relaxed">
            Your text watermark is rendered as an SVG overlay and composited onto the image using Sharp (libvips).
            Choose from six placement options including a tiled pattern for maximum protection. Files are never
            stored on our servers.
          </p>
        </div>

        {/* Related Tools */}
        <div>
          <h3 className="text-sm font-bold text-muted uppercase tracking-wider mb-3">Related Tools</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { href: "/tools/compress", icon: Minimize2, label: "Compress Image" },
              { href: "/tools/resize", icon: Maximize2, label: "Resize Image" },
              { href: "/tools/crop", icon: Crop, label: "Crop Image" },
            ].map(({ href, icon: Icon, label }) => (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center gap-2 p-3 rounded-xl border border-border hover:border-primary/30 hover:shadow-sm transition-all text-center group"
              >
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Icon size={16} className="text-primary" />
                </div>
                <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                  {label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </div>
  );
}
