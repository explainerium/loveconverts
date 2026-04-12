"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { FileImage, Upload, Download, X, CheckCircle2, Loader2, Package, Plus, ImageIcon, Minimize2, Maximize2, Crop } from "lucide-react";
import Link from "next/link";
import JSZip from "jszip";
import JsonLd from "@/app/components/JsonLd";
import { useToolShortcuts } from "@/app/components/useToolShortcuts";
import KeyboardShortcuts from "@/app/components/KeyboardShortcuts";

interface Result {
  name: string;
  originalName: string;
  originalSize: number;
  newSize: number;
  url: string;
}

function fmtBytes(n: number) {
  if (n < 1024) return n + " B";
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + " KB";
  return (n / (1024 * 1024)).toFixed(2) + " MB";
}

type Stage = "upload" | "converting" | "done";

export default function HeicToJpgPage() {
  const [stage, setStage] = useState<Stage>("upload");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [quality, setQuality] = useState(90);
  const [results, setResults] = useState<Result[]>([]);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted.length === 0) return;
    setError(null);
    const newFiles = [...files, ...accepted].slice(0, 30);
    setFiles(newFiles);
    setPreviews(newFiles.map((f) => URL.createObjectURL(f)));
  }, [files]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { "image/heic": [".heic"], "image/heif": [".heif"] },
    maxSize: 20 * 1024 * 1024,
    noClick: files.length > 0,
    noKeyboard: files.length > 0,
  });

  const removeFile = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    setFiles((f) => f.filter((_, i) => i !== index));
    setPreviews((p) => p.filter((_, i) => i !== index));
  };

  const convertAll = async () => {
    if (files.length === 0) return;
    setStage("converting");
    setProgress({ done: 0, total: files.length });
    setResults([]);
    setError(null);

    const newResults: Result[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("quality", String(quality));

        const res = await fetch("/api/tools/convert-to-jpg", {
          method: "POST",
          body: fd,
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({ error: "Conversion failed" }));
          setError(data.error || `Failed to convert ${file.name}`);
          continue;
        }

        const blob = await res.blob();
        const origSize = parseInt(res.headers.get("X-Original-Size") || "0") || file.size;
        const newSize = parseInt(res.headers.get("X-Output-Size") || "0") || blob.size;
        const disp = res.headers.get("Content-Disposition") || "";
        const match = disp.match(/filename="(.+?)"/);
        const name = match?.[1] || file.name.replace(/\.[^.]+$/, ".jpg");

        newResults.push({ name, originalName: file.name, originalSize: origSize, newSize, url: URL.createObjectURL(blob) });
      } catch {
        setError(`Failed to convert ${file.name}`);
      }

      setProgress({ done: i + 1, total: files.length });
    }

    setResults(newResults);
    if (newResults.length > 0) setStage("done");
    else { setStage("upload"); if (!error) setError("Conversion failed. Please try again."); }
  };

  const downloadAll = async () => {
    if (results.length === 1) {
      const a = document.createElement("a"); a.href = results[0].url; a.download = results[0].name; a.click(); return;
    }
    const zip = new JSZip();
    for (const r of results) { const resp = await fetch(r.url); const blob = await resp.blob(); zip.file(r.name, blob); }
    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const a = document.createElement("a"); a.href = url; a.download = "heic-to-jpg.zip"; a.click(); URL.revokeObjectURL(url);
  };

  const reset = () => {
    previews.forEach((p) => URL.revokeObjectURL(p));
    results.forEach((r) => URL.revokeObjectURL(r.url));
    setFiles([]); setPreviews([]); setResults([]); setQuality(90); setStage("upload"); setError(null);
  };

  const handlePastedFile = useCallback((file: File) => {
    setError(null);
    const newFiles = [...files, file].slice(0, 30);
    setFiles(newFiles);
    setPreviews(newFiles.map((f) => URL.createObjectURL(f)));
  }, [files]);

  useToolShortcuts({
    onPaste: handlePastedFile,
    onReset: () => reset(),
    onAction: () => convertAll(),
    onDownload: () => downloadAll(),
    canAct: files.length > 0 && stage === "upload",
    canDownload: stage === "done" && results.length > 0,
  });

  const faqData = [
    { question: "What is HEIC format?", answer: "HEIC (High Efficiency Image Container) is the default photo format on iPhones since iOS 11. It produces smaller files than JPG but is not supported by most Windows software, websites, or older apps." },
    { question: "Will I lose quality converting HEIC to JPG?", answer: "At 85% quality or above the difference is not visible to the human eye. Use the quality slider to control output size versus quality." },
    { question: "Is this tool free?", answer: "Yes, completely free. No signup, no watermark, no limits." },
    { question: "Does it work on Windows and Android?", answer: "Yes. LoveConverts runs in any browser on any device. You do not need to install anything." },
  ];

  return (
    <div className="min-h-screen bg-background">
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "FAQPage",
        mainEntity: faqData.map(f => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })),
      }} />

      {/* ─── STAGE 1: Upload ─── */}
      {stage === "upload" && (
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="text-center space-y-3 mb-10">
            <h1 className="text-4xl font-extrabold text-foreground">HEIC to JPG Converter</h1>
            <p className="text-muted max-w-lg mx-auto">
              iPhone and iPad cameras save photos in HEIC format by default.
              Most apps, websites, and Windows computers do not support HEIC files.
              Converting to JPG makes your photos work everywhere instantly.
            </p>
          </div>

          {files.length === 0 ? (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-3xl p-16 text-center cursor-pointer transition-all max-w-xl mx-auto ${
                isDragActive ? "border-primary bg-primary-light" : "border-border hover:border-primary/60 hover:bg-primary-light/30"
              }`}
            >
              <input {...getInputProps()} />
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Upload size={28} className="text-primary" />
              </div>
              <p className="font-bold text-foreground text-lg mb-1">
                {isDragActive ? "Drop HEIC files here" : "Select HEIC files"}
              </p>
              <p className="text-sm text-muted">or drag and drop them here</p>
              <p className="text-xs text-muted mt-3">HEIC and HEIF files only. Up to 20 MB each. Max 30 files.</p>
              <p className="text-[11px] text-muted/60 mt-2">You can also paste an image directly with Ctrl+V / Cmd+V</p>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto space-y-4">
              <div {...getRootProps()} className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                <input {...getInputProps()} />
                {files.map((f, i) => (
                  <div key={f.name + i} className="relative group">
                    <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 border border-border flex items-center justify-center">
                      <FileImage size={24} className="text-muted" />
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <X size={10} />
                    </button>
                    <p className="text-[9px] text-muted text-center mt-1 truncate">{fmtBytes(f.size)}</p>
                  </div>
                ))}
                <button onClick={(e) => { e.stopPropagation(); open(); }}
                  className="aspect-square rounded-xl border-2 border-dashed border-border hover:border-primary/60 flex flex-col items-center justify-center gap-1 transition-colors">
                  <Plus size={20} className="text-muted" /><span className="text-[10px] text-muted">Add</span>
                </button>
              </div>

              <p className="text-xs text-muted text-center">{files.length} file{files.length !== 1 ? "s" : ""} selected</p>

              <div className="bg-card border border-border rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-foreground">JPEG Quality</span>
                  <span className="text-sm font-bold text-primary">{quality}%</span>
                </div>
                <input type="range" min={1} max={100} value={quality} onChange={(e) => setQuality(Number(e.target.value))} className="custom-range w-full" />
                <div className="flex justify-between text-[10px] text-muted mt-1"><span>Smallest file</span><span>Best quality</span></div>
              </div>

              <button onClick={convertAll}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary text-white text-base font-bold rounded-2xl hover:bg-primary-hover transition-colors shadow-lg">
                <FileImage size={18} />
                Convert {files.length > 1 ? `${files.length} Files` : "File"} to JPG
              </button>
            </div>
          )}

          {error && (
            <div className="max-w-xl mx-auto mt-4 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <ImageIcon size={16} />{error}
            </div>
          )}
        </div>
      )}

      {/* ─── STAGE 2: Converting ─── */}
      {stage === "converting" && (
        <div className="max-w-md mx-auto px-4 py-32 text-center space-y-6">
          <Loader2 size={48} className="animate-spin text-primary mx-auto" />
          <div>
            <h2 className="text-xl font-bold text-foreground mb-1">Converting HEIC to JPG...</h2>
            <p className="text-sm text-muted">{progress.done} of {progress.total} done</p>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${progress.total > 0 ? (progress.done / progress.total) * 100 : 0}%` }} />
          </div>
        </div>
      )}

      {/* ─── STAGE 3: Results ─── */}
      {stage === "done" && results.length > 0 && (
        <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center space-y-2">
            <CheckCircle2 size={40} className="text-green-500 mx-auto" />
            <h2 className="text-xl font-bold text-foreground">{results.length} file{results.length !== 1 ? "s" : ""} converted to JPG</h2>
            <p className="text-sm text-green-700">HEIC files successfully converted to JPEG format</p>
          </div>

          <button onClick={downloadAll}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary text-white text-base font-bold rounded-2xl hover:bg-primary-hover transition-colors shadow-lg">
            {results.length > 1 ? <Package size={18} /> : <Download size={18} />}
            {results.length > 1 ? "Download All (ZIP)" : "Download JPG Image"}
          </button>

          <div className="space-y-2">
            {results.map((r) => (
              <div key={r.name} className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <FileImage size={18} className="text-muted" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{r.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted">
                    <span className="font-semibold text-foreground/70">HEIC</span><span>&rarr;</span>
                    <span className="text-amber-600 font-semibold">JPG</span>
                    <span className="text-muted/60">|</span>
                    <span>{fmtBytes(r.originalSize)}</span><span>&rarr;</span>
                    <span className="text-green-600 font-semibold">{fmtBytes(r.newSize)}</span>
                  </div>
                </div>
                <a href={r.url} download={r.name} className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors flex-shrink-0">
                  <Download size={16} />
                </a>
              </div>
            ))}
          </div>

          <button onClick={reset}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-muted border border-border rounded-xl hover:border-primary/40 transition-colors">
            Convert More Files
          </button>
        </div>
      )}

      {/* ─── Bottom section ─── */}
      <div className="max-w-3xl mx-auto px-4 pb-12 space-y-8">
        {stage === "upload" && (
          <>
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="font-bold text-foreground mb-4">How it works</h2>
              <div className="grid grid-cols-3 gap-4 text-center">
                {[
                  { step: "1", title: "Upload", desc: "Select HEIC files from your iPhone or device" },
                  { step: "2", title: "Convert", desc: "We convert your HEIC photos to universal JPG format" },
                  { step: "3", title: "Download", desc: "Download converted files individually or as ZIP" },
                ].map(({ step, title, desc }) => (
                  <div key={step} className="space-y-2">
                    <div className="w-8 h-8 rounded-full bg-primary text-white text-sm font-bold flex items-center justify-center mx-auto">{step}</div>
                    <p className="text-sm font-semibold text-foreground">{title}</p>
                    <p className="text-xs text-muted">{desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "HEIC & HEIF", sub: "iPhone photos" },
                { label: "Up to 30 files", sub: "Batch convert" },
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

        {/* FAQ */}
        <div>
          <h2 className="font-bold text-foreground mb-4">Frequently Asked Questions</h2>
          <div className="space-y-2">
            {faqData.map((faq, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-5">
                <h3 className="font-semibold text-foreground mb-2 text-sm">{faq.question}</h3>
                <p className="text-sm text-muted leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-muted uppercase tracking-wider mb-3">Related Tools</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { href: "/tools/compress", icon: Minimize2, label: "Compress" },
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
