"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Droplets, Upload, Download, X, CheckCircle2, Loader2, Minimize2, Maximize2, Crop, ImageIcon } from "lucide-react";
import Link from "next/link";

type Position = "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right" | "tiled";

function fmtBytes(n: number) {
  if (n < 1024) return n + " B";
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + " KB";
  return (n / (1024 * 1024)).toFixed(2) + " MB";
}

type Stage = "upload" | "processing" | "done";

export default function WatermarkPage() {
  const [stage, setStage] = useState<Stage>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultName, setResultName] = useState("");
  const [resultSize, setResultSize] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Watermark settings
  const [text, setText] = useState("Watermark");
  const [fontSize, setFontSize] = useState(40);
  const [opacity, setOpacity] = useState(50);
  const [color, setColor] = useState("#ffffff");
  const [position, setPosition] = useState<Position>("center");

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Live preview on canvas
  useEffect(() => {
    if (!file || !preview) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const img = new Image();
    img.onload = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const maxW = 600;
      const maxH = 400;
      const scale = Math.min(maxW / img.width, maxH / img.height, 1);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);

      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(img, 0, 0, w, h);

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
            ctx.textAlign = "left"; ctx.textBaseline = "top"; tx = pad; ty = pad; break;
          case "top-right":
            ctx.textAlign = "right"; ctx.textBaseline = "top"; tx = w - pad; ty = pad; break;
          case "bottom-left":
            ctx.textAlign = "left"; ctx.textBaseline = "bottom"; tx = pad; ty = h - pad; break;
          case "bottom-right":
            ctx.textAlign = "right"; ctx.textBaseline = "bottom"; tx = w - pad; ty = h - pad; break;
          case "center":
          default:
            ctx.textAlign = "center"; ctx.textBaseline = "middle"; tx = w / 2; ty = h / 2; break;
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
    setError(null);
    if (preview) URL.revokeObjectURL(preview);
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }, [preview]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    maxSize: 20 * 1024 * 1024,
    multiple: false,
    noClick: !!file,
    noKeyboard: !!file,
  });

  const removeFile = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    setError(null);
  };

  const applyWatermark = async () => {
    if (!file || !text.trim()) return;
    setStage("processing");
    setError(null);

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("text", text);
      fd.append("fontSize", String(fontSize));
      fd.append("opacity", String(opacity));
      fd.append("color", color);
      fd.append("position", position);

      const res = await fetch("/api/tools/watermark", { method: "POST", body: fd });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Watermark failed" }));
        setError(data.error || "Watermark processing failed");
        setStage("upload");
        return;
      }

      const blob = await res.blob();
      const disp = res.headers.get("Content-Disposition") || "";
      const match = disp.match(/filename="(.+?)"/);
      const name = match?.[1] || file.name;

      if (resultUrl) URL.revokeObjectURL(resultUrl);
      setResultUrl(URL.createObjectURL(blob));
      setResultName(name);
      setResultSize(blob.size);
      setStage("done");
    } catch {
      setError("Watermark processing failed. Please try again.");
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
    if (preview) URL.revokeObjectURL(preview);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setFile(null);
    setPreview(null);
    setResultUrl(null);
    setResultName("");
    setResultSize(0);
    setStage("upload");
    setError(null);
    setText("Watermark");
    setFontSize(40);
    setOpacity(50);
    setColor("#ffffff");
    setPosition("center");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* --- STAGE 1: Upload --- */}
      {stage === "upload" && (
        <div className="max-w-4xl mx-auto px-4 py-16">
          {/* Hero */}
          <div className="text-center space-y-3 mb-10">
            <h1 className="text-4xl font-extrabold text-foreground">Add Watermark</h1>
            <p className="text-muted max-w-lg mx-auto">
              Protect your photos with custom text watermarks. Choose position, size, opacity, and color.
            </p>
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
              <p className="text-xs text-muted mt-3">JPG, PNG, WEBP, GIF, AVIF. Up to 20 MB.</p>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto space-y-4">
              {/* Preview */}
              <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-3">
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
                <div className="flex justify-center bg-gray-100 rounded-xl overflow-hidden">
                  <canvas
                    ref={canvasRef}
                    className="max-w-full h-auto"
                    style={{ maxHeight: 400 }}
                  />
                </div>
              </div>

              {/* Watermark controls */}
              <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
                {/* Text */}
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
                    min={20}
                    max={80}
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="custom-range w-full"
                  />
                  <div className="flex justify-between text-[10px] text-muted mt-1">
                    <span>20px</span>
                    <span>80px</span>
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

                {/* Color */}
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

                {/* Position pills */}
                <div>
                  <span className="text-sm font-semibold text-foreground block mb-2">Position</span>
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        { key: "center", label: "Center" },
                        { key: "top-left", label: "Top-Left" },
                        { key: "top-right", label: "Top-Right" },
                        { key: "bottom-left", label: "Bottom-Left" },
                        { key: "bottom-right", label: "Bottom-Right" },
                        { key: "tiled", label: "Tiled" },
                      ] as { key: Position; label: string }[]
                    ).map((p) => (
                      <button
                        key={p.key}
                        onClick={() => setPosition(p.key)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-full border transition-all ${
                          position === p.key
                            ? "border-primary bg-primary-light text-primary"
                            : "border-border text-foreground hover:border-primary/40"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Apply button */}
              <button
                onClick={applyWatermark}
                disabled={!text.trim()}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary text-white text-base font-bold rounded-2xl hover:bg-primary-hover transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Droplets size={18} />
                Add Watermark
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

      {/* --- STAGE 2: Processing --- */}
      {stage === "processing" && (
        <div className="max-w-md mx-auto px-4 py-32 text-center space-y-6">
          <Loader2 size={48} className="animate-spin text-primary mx-auto" />
          <div>
            <h2 className="text-xl font-bold text-foreground mb-1">Adding watermark...</h2>
            <p className="text-sm text-muted">This will only take a moment</p>
          </div>
        </div>
      )}

      {/* --- STAGE 3: Done --- */}
      {stage === "done" && resultUrl && (
        <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">
          {/* Success card */}
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center space-y-2">
            <CheckCircle2 size={40} className="text-green-500 mx-auto" />
            <h2 className="text-xl font-bold text-foreground">Watermark added!</h2>
            <p className="text-sm text-green-700">
              Your image has been watermarked successfully.
            </p>
            <p className="text-xs text-muted">
              {file ? fmtBytes(file.size) : ""} &rarr; {fmtBytes(resultSize)}
            </p>
          </div>

          {/* Download button */}
          <button
            onClick={downloadResult}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary text-white text-base font-bold rounded-2xl hover:bg-primary-hover transition-colors shadow-lg"
          >
            <Download size={18} />
            Download Watermarked Image
          </button>

          {/* Start over */}
          <button
            onClick={reset}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-muted border border-border rounded-xl hover:border-primary/40 transition-colors"
          >
            Watermark Another Image
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
                  { step: "2", title: "Customize", desc: "Set text, position, size, opacity, and color" },
                  { step: "3", title: "Download", desc: "Download your watermarked image instantly" },
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
                { label: "6 positions + tiled", sub: "Full control" },
                { label: "Live preview", sub: "See before applying" },
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
