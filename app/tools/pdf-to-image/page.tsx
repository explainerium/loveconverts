"use client";

import { useState, useCallback, useRef } from "react";
import { useDropzone } from "react-dropzone";
import {
  FileOutput,
  Upload,
  Download,
  X,
  AlertCircle,
  Loader2,
  Zap,
  Package,
  Minimize2,
  FileImage,
  Maximize2,
} from "lucide-react";
import Link from "next/link";
import JSZip from "jszip";
import UpgradeModal from "@/app/components/UpgradeModal";

function fmtBytes(n: number) {
  if (n < 1024) return n + " B";
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + " KB";
  return (n / (1024 * 1024)).toFixed(2) + " MB";
}

type OutputFormat = "jpg" | "png";

interface PageResult {
  page: number;
  data: string; // base64
  width: number;
  height: number;
}

export default function PdfToImagePage() {
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<OutputFormat>("jpg");
  const [quality, setQuality] = useState(85);
  const [pageRange, setPageRange] = useState("all");
  const [processing, setProcessing] = useState(false);
  const [pages, setPages] = useState<PageResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const onDrop = useCallback((accepted: File[]) => {
    setError(null);
    setPages([]);
    if (accepted.length === 0) return;
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

  const clearFile = () => {
    setFile(null);
    setPages([]);
    setError(null);
  };

  const convertPdf = async () => {
    if (!file) return;
    setProcessing(true);
    setError(null);
    setPages([]);

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("format", format);
      fd.append("quality", String(quality));
      fd.append("pages", pageRange);

      abortRef.current = new AbortController();
      const res = await fetch("/api/tools/pdf-to-image", {
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
        setError(data.error || "Conversion failed");
        return;
      }

      const data = await res.json();
      setPages(data.pages || []);
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setError("Conversion failed. Please try again.");
      }
    } finally {
      setProcessing(false);
    }
  };

  const downloadPage = (p: PageResult) => {
    const ext = format;
    const mimeType = format === "png" ? "image/png" : "image/jpeg";
    const byteString = atob(p.data);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const baseName = file?.name.replace(/\.[^/.]+$/, "") || "page";
    a.href = url;
    a.download = `${baseName}-page-${p.page}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAll = async () => {
    if (pages.length === 0) return;
    const zip = new JSZip();
    const ext = format;
    const mimeType = format === "png" ? "image/png" : "image/jpeg";
    const baseName = file?.name.replace(/\.[^/.]+$/, "") || "page";

    for (const p of pages) {
      const byteString = atob(p.data);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: mimeType });
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

  return (
    <div className="min-h-screen bg-background py-10">
      <div className="max-w-3xl mx-auto px-4 space-y-8">
        {/* Hero */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 bg-primary-light text-primary text-xs font-bold px-3 py-1 rounded-full mb-2">
            <FileOutput size={12} /> PDF TO IMAGE
          </div>
          <h1 className="text-3xl font-extrabold text-foreground">
            Convert PDF to Image
          </h1>
          <p className="text-muted max-w-md mx-auto text-sm">
            Extract PDF pages as JPG or PNG images. Select specific pages or
            convert all. Free, no signup required.
          </p>
        </div>

        {/* Controls */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
          {/* Output Format */}
          <div>
            <span className="text-sm font-semibold text-foreground mb-2 block">
              Output Format
            </span>
            <div className="grid grid-cols-2 gap-2">
              {(["jpg", "png"] as OutputFormat[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`p-2 rounded-xl border text-center transition-all ${
                    format === f
                      ? "border-primary bg-primary-light"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <div
                    className={`text-xs font-bold ${
                      format === f ? "text-primary" : "text-foreground"
                    }`}
                  >
                    {f.toUpperCase()}
                  </div>
                  <div className="text-[10px] text-muted">
                    {f === "jpg" ? "Smaller size" : "Lossless quality"}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Quality */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-foreground">
                Quality
              </span>
              <span className="text-sm font-bold text-primary">
                {quality}%
              </span>
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

          {/* Page Range */}
          <div>
            <span className="text-sm font-semibold text-foreground mb-2 block">
              Pages
            </span>
            <input
              type="text"
              value={pageRange}
              onChange={(e) => setPageRange(e.target.value)}
              placeholder='e.g. "all", "1-5", "1,3,5"'
              className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
            <p className="text-[10px] text-muted mt-1">
              Enter &quot;all&quot; for all pages, &quot;1-5&quot; for a range,
              or &quot;1,3,5&quot; for specific pages
            </p>
          </div>
        </div>

        {/* Drop zone (show when no file is selected) */}
        {!file && (
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
              className={`mx-auto mb-3 ${
                isDragActive ? "text-primary" : "text-muted"
              }`}
            />
            <p className="font-semibold text-foreground">
              {isDragActive
                ? "Drop PDF here"
                : "Drag & drop a PDF or click to browse"}
            </p>
            <p className="text-xs text-muted mt-1">PDF files · Max 20 MB</p>
          </div>
        )}

        {/* File selected */}
        {file && pages.length === 0 && (
          <div className="space-y-4">
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
                onClick={clearFile}
                className="p-1.5 text-muted hover:text-red-500 transition-colors flex-shrink-0"
              >
                <X size={14} />
              </button>
            </div>

            <button
              onClick={convertPdf}
              disabled={processing}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Converting PDF...
                </>
              ) : (
                <>
                  <FileOutput size={16} />
                  Convert to {format.toUpperCase()}
                </>
              )}
            </button>
          </div>
        )}

        {/* Processing */}
        {processing && (
          <div className="flex items-center gap-2 text-sm text-muted">
            <Loader2 size={16} className="animate-spin text-primary" />
            Extracting pages from PDF...
          </div>
        )}

        {/* Results */}
        {pages.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-foreground">
                Pages ({pages.length})
              </h2>
              <div className="flex items-center gap-2">
                {pages.length > 1 && (
                  <button
                    onClick={downloadAll}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-primary border border-primary/30 rounded-lg hover:bg-primary-light transition-colors"
                  >
                    <Package size={13} /> Download All ZIP
                  </button>
                )}
                <button
                  onClick={clearFile}
                  className="px-3 py-1.5 text-xs font-bold text-muted border border-border rounded-lg hover:border-primary/40 transition-colors"
                >
                  Convert Another
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {pages.map((p) => (
                <div
                  key={p.page}
                  className="bg-card border border-border rounded-2xl overflow-hidden group"
                >
                  <div className="aspect-[3/4] bg-gray-100 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`data:image/${format === "png" ? "png" : "jpeg"};base64,${p.data}`}
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
            <h3 className="text-sm font-bold text-foreground">
              How PDF to image works
            </h3>
          </div>
          <p className="text-sm text-muted leading-relaxed">
            Your PDF is processed server-side using Sharp (libvips). Each page
            is rendered as a high-quality image in your chosen format. You can
            select specific pages or convert the entire document. Files are never
            stored on our servers.
          </p>
        </div>

        {/* Related Tools */}
        <div>
          <h3 className="text-sm font-bold text-muted uppercase tracking-wider mb-3">
            Related Tools
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                href: "/tools/image-to-pdf",
                icon: FileImage,
                label: "Image to PDF",
              },
              {
                href: "/tools/compress",
                icon: Minimize2,
                label: "Compress Image",
              },
              {
                href: "/tools/resize",
                icon: Maximize2,
                label: "Resize Image",
              },
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

      <UpgradeModal
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
      />
    </div>
  );
}
