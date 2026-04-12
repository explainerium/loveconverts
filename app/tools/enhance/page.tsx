"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Download, Loader2, Sparkles, Minimize2, Maximize2, Crop, Wand2, ImageIcon } from "lucide-react";
import Link from "next/link";
import { useToolShortcuts } from "@/app/components/useToolShortcuts";
import KeyboardShortcuts from "@/app/components/KeyboardShortcuts";

function fmtBytes(n: number) {
  if (n < 1024) return n + " B";
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + " KB";
  return (n / (1024 * 1024)).toFixed(2) + " MB";
}

type Stage = "upload" | "enhancing" | "done";

type EnhanceMode = "auto" | "upscale" | "sharpen" | "hdr" | "color" | "denoise" | "portrait" | "lowlight";

interface ModeCard {
  key: EnhanceMode;
  emoji: string;
  label: string;
  desc: string;
}

const MODES: ModeCard[] = [
  { key: "auto",     emoji: "\u2728",     label: "Magic Fix",    desc: "Auto-enhance everything" },
  { key: "upscale",  emoji: "\uD83D\uDD0D", label: "Super Zoom",   desc: "Upscale 2x or 4x" },
  { key: "sharpen",  emoji: "\u26A1",     label: "Sharpen",      desc: "Crispy sharp details" },
  { key: "hdr",      emoji: "\uD83C\uDF04", label: "HDR",          desc: "Dramatic dynamic range" },
  { key: "color",    emoji: "\uD83C\uDF08", label: "Color Boost",  desc: "Make colors pop" },
  { key: "denoise",  emoji: "\uD83E\uDDF9", label: "Denoise",      desc: "Remove grain and noise" },
  { key: "portrait", emoji: "\uD83E\uDD33", label: "Portrait",     desc: "Flawless skin and tone" },
  { key: "lowlight", emoji: "\uD83C\uDF19", label: "Night Vision", desc: "Brighten dark photos" },
];

export default function EnhancePage() {
  const [stage, setStage] = useState<Stage>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [mode, setMode] = useState<EnhanceMode>("auto");
  const [scale, setScale] = useState(2);
  const [resultUrl, setResultUrl] = useState("");
  const [resultName, setResultName] = useState("");
  const [originalSize, setOriginalSize] = useState(0);
  const [resultSize, setResultSize] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((accepted: File[]) => {
    const f = accepted[0];
    if (!f) return;
    setError(null);
    setFile(f);
    setOriginalSize(f.size);
    setMode("auto");
    setScale(2);

    const isHeic =
      f.name.toLowerCase().endsWith(".heic") ||
      f.name.toLowerCase().endsWith(".heif") ||
      f.type === "image/heic" ||
      f.type === "image/heif";

    if (isHeic) {
      // HEIC not supported by most browsers; use a placeholder
      setPreview("");
    } else {
      setPreview(URL.createObjectURL(f));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [], "image/heic": [".heic"], "image/heif": [".heif"] },
    maxSize: 50 * 1024 * 1024,
    maxFiles: 1,
  });

  const enhance = async () => {
    if (!file) return;
    setStage("enhancing");
    setError(null);

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("mode", mode);
      fd.append("scale", mode === "upscale" ? String(scale) : "1");
      fd.append("preview", "false");
      fd.append("outputFormat", "jpg");
      fd.append("quality", "92");

      const res = await fetch("/api/tools/enhance", {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Enhancement failed" }));
        setError(data.error || "Enhancement failed");
        setStage("upload");
        return;
      }

      const blob = await res.blob();
      const name = `${file.name.replace(/\.[^.]+$/, "")}-enhanced.jpg`;
      setResultUrl(URL.createObjectURL(blob));
      setResultName(name);
      setResultSize(fmtBytes(blob.size));
      setStage("done");
    } catch {
      setError("Something went wrong. Please try again.");
      setStage("upload");
    }
  };

  const reset = () => {
    if (preview) URL.revokeObjectURL(preview);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setFile(null);
    setPreview("");
    setResultUrl("");
    setResultName("");
    setResultSize("");
    setOriginalSize(0);
    setStage("upload");
    setError(null);
    setMode("auto");
    setScale(2);
  };

  const handlePastedFile = useCallback((pastedFile: File) => {
    setError(null);
    setFile(pastedFile);
    setOriginalSize(pastedFile.size);
    setMode("auto");
    setScale(2);

    const isHeic =
      pastedFile.name.toLowerCase().endsWith(".heic") ||
      pastedFile.name.toLowerCase().endsWith(".heif") ||
      pastedFile.type === "image/heic" ||
      pastedFile.type === "image/heif";

    if (isHeic) {
      setPreview("");
    } else {
      setPreview(URL.createObjectURL(pastedFile));
    }
  }, []);

  useToolShortcuts({
    onPaste: handlePastedFile,
    onReset: () => reset(),
    onAction: () => enhance(),
    onDownload: () => {
      if (resultUrl) {
        const a = document.createElement("a");
        a.href = resultUrl;
        a.download = resultName;
        a.click();
      }
    },
    canAct: !!file && stage === "upload",
    canDownload: stage === "done" && !!resultUrl,
  });

  const modeLabel = MODES.find((m) => m.key === mode)?.label || mode;

  return (
    <div className="min-h-screen bg-background">
      {/* ─── STAGE 1: Upload ─── */}
      {stage === "upload" && (
        <div className="max-w-4xl mx-auto px-4 py-16">
          {/* Hero */}
          <div className="text-center space-y-3 mb-10">
            <h1 className="text-4xl font-extrabold text-foreground">AI Enhance</h1>
            <p className="text-muted max-w-lg mx-auto">
              Automatically enhance your photos with one click.
            </p>
          </div>

          {/* Drop zone (no file selected) */}
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
              <p className="text-xs text-muted mt-3">JPG, PNG, WEBP, HEIC. Up to 50 MB.</p>
              <p className="text-[11px] text-muted/60 mt-2">You can also paste an image directly with Ctrl+V / Cmd+V</p>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto space-y-6">
              {/* File preview */}
              <div className="flex items-center gap-4 bg-card border border-border rounded-xl p-3">
                {preview && (
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={preview} alt={file.name} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                  <p className="text-xs text-muted">{fmtBytes(file.size)}</p>
                </div>
                <button
                  onClick={reset}
                  className="text-xs font-bold text-muted hover:text-foreground transition-colors px-3 py-1.5 border border-border rounded-lg"
                >
                  Change
                </button>
              </div>

              {/* Mode selector */}
              <div>
                <p className="text-sm font-bold text-foreground mb-3">Choose enhancement mode</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {MODES.map((m) => (
                    <button
                      key={m.key}
                      onClick={() => setMode(m.key)}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        mode === m.key
                          ? "border-primary bg-primary-light/30"
                          : "border-border hover:border-primary/40"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-base">{m.emoji}</span>
                        <span className="text-xs font-bold text-foreground">{m.label}</span>
                      </div>
                      <p className="text-[10px] text-muted leading-tight">{m.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Scale selector (only for Super Zoom) */}
              {mode === "upscale" && (
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-foreground">Scale:</span>
                  <div className="flex gap-2">
                    {[2, 4].map((s) => (
                      <button
                        key={s}
                        onClick={() => setScale(s)}
                        className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${
                          scale === s
                            ? "bg-primary text-white"
                            : "bg-card border border-border text-foreground hover:border-primary/40"
                        }`}
                      >
                        {s}x
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Enhance button */}
              <button
                onClick={enhance}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary text-white text-base font-bold rounded-2xl hover:bg-primary-hover transition-colors shadow-lg"
              >
                <Sparkles size={18} />
                Enhance Image
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

      {/* ─── STAGE 2: Enhancing ─── */}
      {stage === "enhancing" && (
        <div className="max-w-md mx-auto px-4 py-32 text-center space-y-6">
          <Loader2 size={48} className="animate-spin text-primary mx-auto" />
          <div>
            <h2 className="text-xl font-bold text-foreground mb-1">Enhancing your image...</h2>
            <p className="text-sm text-muted">
              Applying {modeLabel}{mode === "upscale" ? ` (${scale}x)` : ""}
            </p>
          </div>
        </div>
      )}

      {/* ─── STAGE 3: Results ─── */}
      {stage === "done" && resultUrl && (
        <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">
          {/* Success card */}
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center space-y-2">
            <Sparkles size={40} className="text-green-500 mx-auto" />
            <h2 className="text-xl font-bold text-foreground">Image enhanced</h2>
            <p className="text-sm text-green-700">
              {modeLabel}{mode === "upscale" ? ` (${scale}x)` : ""} applied successfully
            </p>
            <p className="text-xs text-muted">
              {fmtBytes(originalSize)} original &middot; {resultSize} enhanced
            </p>
          </div>

          {/* Before / After */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-xs font-bold text-muted text-center uppercase tracking-wider">Before</p>
              <div className="border border-border rounded-xl overflow-hidden bg-gray-50 aspect-square flex items-center justify-center">
                {preview ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={preview} alt="Original" className="max-w-full max-h-full object-contain" />
                ) : (
                  <p className="text-xs text-muted">Preview not available</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-bold text-muted text-center uppercase tracking-wider">After</p>
              <div className="border border-border rounded-xl overflow-hidden bg-gray-50 aspect-square flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={resultUrl} alt="Enhanced" className="max-w-full max-h-full object-contain" />
              </div>
            </div>
          </div>

          {/* Download button */}
          <a
            href={resultUrl}
            download={resultName}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary text-white text-base font-bold rounded-2xl hover:bg-primary-hover transition-colors shadow-lg"
          >
            <Download size={18} />
            Download Enhanced Image
          </a>

          {/* Start over */}
          <button
            onClick={reset}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-muted border border-border rounded-xl hover:border-primary/40 transition-colors"
          >
            Enhance Another Image
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
                  { step: "1", title: "Upload", desc: "Select a photo from your device" },
                  { step: "2", title: "Pick a mode", desc: "Choose an enhancement style or use Magic Fix" },
                  { step: "3", title: "Download", desc: "Get your enhanced photo instantly" },
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
                { label: "8 enhancement modes", sub: "One click each" },
                { label: "Up to 50 MB", sub: "Large files OK" },
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
      <div className="max-w-3xl mx-auto px-4 pb-6">
        <KeyboardShortcuts />
      </div>
    </div>
  );
}
