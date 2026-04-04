"use client";

import { useState, useCallback, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { FileOutput, Upload, Download, X, CheckCircle2, Loader2, Package, Minimize2, FileImage, Maximize2, AlertCircle } from "lucide-react";
import Link from "next/link";
import JSZip from "jszip";
import UpgradeModal from "@/app/components/UpgradeModal";

function fmtBytes(n: number) {
  if (n < 1024) return n + " B";
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + " KB";
  return (n / (1024 * 1024)).toFixed(2) + " MB";
}

type Stage = "upload" | "converting" | "done";
type OutputFormat = "jpg" | "png";

interface PageResult {
  page: number;
  data: string; // base64
  width: number;
  height: number;
  blobUrl: string;
}

export default function PdfToImagePage() {
  const [stage, setStage] = useState<Stage>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<OutputFormat>("jpg");
  const [quality, setQuality] = useState(90);
  const [pageRange, setPageRange] = useState("");
  const [pages, setPages] = useState<PageResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted.length === 0) return;
    setError(null);
    const f = accepted[0];
    if (f.size > 20 * 1024 * 1024) {
      setError("File exceeds 20 MB limit.");
      return;
    }
    setFile(f);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxSize: 20 * 1024 * 1024,
    multiple: false,
  });

  const removeFile = () => {
    setFile(null);
    setError(null);
  };

  const convertPdf = async () => {
    if (!file) return;
    setStage("converting");
    setError(null);
    setPages([]);

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("format", format);
      fd.append("quality", String(quality));
      fd.append("pages", pageRange || "all");

      abortRef.current = new AbortController();
      const res = await fetch("/api/tools/pdf-to-image", {
        method: "POST",
        body: fd,
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Conversion failed" }));
        if (data.code === "RATE_LIMIT") {
          setShowUpgrade(true);
          setStage("upload");
          return;
        }
        setError(data.error || "Conversion failed");
        setStage("upload");
        return;
      }

      const data = await res.json();
      const rawPages: { page: number; data: string; width: number; height: number }[] = data.pages || [];

      if (rawPages.length === 0) {
        setError("No pages could be extracted from this PDF.");
        setStage("upload");
        return;
      }

      // Convert base64 to blob URLs for display/download
      const mimeType = format === "png" ? "image/png" : "image/jpeg";
      const pagesWithBlobs: PageResult[] = rawPages.map((p) => {
        const byteString = atob(p.data);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], { type: mimeType });
        return {
          ...p,
          blobUrl: URL.createObjectURL(blob),
        };
      });

      setPages(pagesWithBlobs);
      setStage("done");
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setError("Conversion failed. Please try again.");
      }
      setStage("upload");
    }
  };

  const downloadPage = (p: PageResult) => {
    const ext = format;
    const baseName = file?.name.replace(/\.[^/.]+$/, "") || "page";
    const a = document.createElement("a");
    a.href = p.blobUrl;
    a.download = `${baseName}-page-${p.page}.${ext}`;
    a.click();
  };

  const downloadAll = async () => {
    if (pages.length === 0) return;

    if (pages.length === 1) {
      downloadPage(pages[0]);
      return;
    }

    const zip = new JSZip();
    const ext = format;
    const baseName = file?.name.replace(/\.[^/.]+$/, "") || "page";

    for (const p of pages) {
      const resp = await fetch(p.blobUrl);
      const blob = await resp.blob();
      zip.file(`${baseName}-page-${p.page}.${ext}`, blob);
    }

    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${baseName}-pages.zip`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    pages.forEach((p) => URL.revokeObjectURL(p.blobUrl));
    setFile(null);
    setPages([]);
    setStage("upload");
    setError(null);
    setFormat("jpg");
    setQuality(90);
    setPageRange("");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ─── STAGE 1: Upload ─── */}
      {stage === "upload" && (
        <div className="max-w-4xl mx-auto px-4 py-16">
          {/* Hero */}
          <div className="text-center space-y-3 mb-10">
            <h1 className="text-4xl font-extrabold text-foreground">PDF to Image</h1>
            <p className="text-muted max-w-lg mx-auto">
              Extract PDF pages as JPG or PNG images.
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
                {isDragActive ? "Drop PDF here" : "Select a PDF file"}
              </p>
              <p className="text-sm text-muted">or drag and drop it here</p>
              <p className="text-xs text-muted mt-3">PDF files only. Up to 20 MB.</p>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto space-y-4">
              {/* File info card */}
              <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-red-50 flex-shrink-0 flex items-center justify-center">
                  <FileOutput size={24} className="text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-muted mt-0.5">
                    {fmtBytes(file.size)}
                  </p>
                </div>
                <button
                  onClick={removeFile}
                  className="p-1.5 text-muted hover:text-red-500 transition-colors flex-shrink-0"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Controls */}
              <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
                {/* Output Format pills */}
                <div>
                  <span className="text-sm font-semibold text-foreground mb-2 block">
                    Output Format
                  </span>
                  <div className="flex gap-2">
                    {(["jpg", "png"] as OutputFormat[]).map((f) => (
                      <button
                        key={f}
                        onClick={() => setFormat(f)}
                        className={`px-5 py-2 rounded-xl border text-center transition-all text-xs font-bold ${
                          format === f
                            ? "border-primary bg-primary-light text-primary"
                            : "border-border hover:border-primary/40 text-foreground"
                        }`}
                      >
                        {f.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quality slider */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-foreground">Quality</span>
                    <span className="text-sm font-bold text-primary">{quality}%</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={100}
                    value={quality}
                    onChange={(e) => setQuality(Number(e.target.value))}
                    className="custom-range w-full"
                  />
                  <div className="flex justify-between text-[10px] text-muted mt-1">
                    <span>Smallest</span>
                    <span>Best quality</span>
                  </div>
                </div>

                {/* Page range */}
                <div>
                  <span className="text-sm font-semibold text-foreground mb-2 block">
                    Page Range
                  </span>
                  <input
                    type="text"
                    value={pageRange}
                    onChange={(e) => setPageRange(e.target.value)}
                    placeholder="all"
                    className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                  <p className="text-[10px] text-muted mt-1">
                    Enter &quot;all&quot; for all pages, &quot;1-5&quot; for a range, or &quot;1,3,5&quot; for specific pages
                  </p>
                </div>
              </div>

              {/* Convert button */}
              <button
                onClick={convertPdf}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary text-white text-base font-bold rounded-2xl hover:bg-primary-hover transition-colors shadow-lg"
              >
                <FileOutput size={18} />
                Convert PDF
              </button>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="max-w-xl mx-auto mt-4 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
        </div>
      )}

      {/* ─── STAGE 2: Converting ─── */}
      {stage === "converting" && (
        <div className="max-w-md mx-auto px-4 py-32 text-center space-y-6">
          <Loader2 size={48} className="animate-spin text-primary mx-auto" />
          <div>
            <h2 className="text-xl font-bold text-foreground mb-1">Converting PDF pages...</h2>
            <p className="text-sm text-muted">
              This may take a moment for large files
            </p>
          </div>
        </div>
      )}

      {/* ─── STAGE 3: Results ─── */}
      {stage === "done" && pages.length > 0 && (
        <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">
          {/* Summary card */}
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center space-y-2">
            <CheckCircle2 size={40} className="text-green-500 mx-auto" />
            <h2 className="text-xl font-bold text-foreground">
              {pages.length} page{pages.length !== 1 ? "s" : ""} converted
            </h2>
            <p className="text-sm text-green-700">
              Extracted as {format.toUpperCase()} images
            </p>
          </div>

          {/* Download All button */}
          <button
            onClick={downloadAll}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary text-white text-base font-bold rounded-2xl hover:bg-primary-hover transition-colors shadow-lg"
          >
            {pages.length > 1 ? <Package size={18} /> : <Download size={18} />}
            {pages.length > 1 ? "Download All (ZIP)" : "Download Image"}
          </button>

          {/* Page thumbnails grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {pages.map((p) => (
              <div
                key={p.page}
                className="bg-card border border-border rounded-2xl overflow-hidden group"
              >
                <div className="aspect-[3/4] bg-gray-100 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.blobUrl}
                    alt={`Page ${p.page}`}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="p-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-foreground">
                      Page {p.page}
                    </p>
                    <p className="text-[10px] text-muted">
                      {p.width} x {p.height}
                    </p>
                  </div>
                  <button
                    onClick={() => downloadPage(p)}
                    className="flex items-center gap-1 px-2 py-1 bg-primary text-white text-[10px] font-bold rounded-lg hover:bg-primary-hover transition-colors"
                  >
                    <Download size={10} /> Save
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Start over */}
          <button
            onClick={reset}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-muted border border-border rounded-xl hover:border-primary/40 transition-colors"
          >
            Convert Another PDF
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
                  { step: "1", title: "Upload", desc: "Select a PDF file from your device" },
                  { step: "2", title: "Convert", desc: "We extract each page as a high-quality image" },
                  { step: "3", title: "Download", desc: "Download pages individually or as ZIP" },
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
                { label: "JPG & PNG output", sub: "Your choice" },
                { label: "Up to 50 pages", sub: "Per conversion" },
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
              { href: "/tools/image-to-pdf", icon: FileImage, label: "Image to PDF" },
              { href: "/tools/compress", icon: Minimize2, label: "Compress Image" },
              { href: "/tools/resize", icon: Maximize2, label: "Resize Image" },
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

      <UpgradeModal
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
      />
    </div>
  );
}
