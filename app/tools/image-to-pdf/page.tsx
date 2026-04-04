"use client";

import { useState, useCallback, useRef, DragEvent } from "react";
import { useDropzone } from "react-dropzone";
import { FileImage, Upload, Download, X, CheckCircle2, Loader2, Plus, ImageIcon, Minimize2, Maximize2, Crop, Wand2 } from "lucide-react";
import Link from "next/link";

type PageSize = "a4" | "letter" | "fit";
type Orientation = "portrait" | "landscape";
type Stage = "upload" | "converting" | "done";

interface ImageFile {
  id: string;
  file: File;
  preview: string;
}

function fmtBytes(n: number) {
  if (n < 1024) return n + " B";
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + " KB";
  return (n / (1024 * 1024)).toFixed(2) + " MB";
}

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const MAX_IMAGES = 20;
const ACCEPTED_TYPES: Record<string, string[]> = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
  "image/gif": [".gif"],
};

export default function ImageToPdfPage() {
  const [stage, setStage] = useState<Stage>("upload");
  const [images, setImages] = useState<ImageFile[]>([]);
  const [pageSize, setPageSize] = useState<PageSize>("a4");
  const [orientation, setOrientation] = useState<Orientation>("portrait");
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const dragItemRef = useRef<number | null>(null);
  const dragOverItemRef = useRef<number | null>(null);

  const addImages = useCallback(
    (files: File[]) => {
      setError(null);
      const remaining = MAX_IMAGES - images.length;
      if (remaining <= 0) {
        setError(`Maximum ${MAX_IMAGES} images allowed.`);
        return;
      }

      const toAdd = files.slice(0, remaining);
      if (files.length > remaining) {
        setError(`Only ${remaining} more image(s) can be added. Max is ${MAX_IMAGES}.`);
      }

      const newImages: ImageFile[] = toAdd
        .filter((f) => {
          if (f.size > MAX_FILE_SIZE) {
            setError(`"${f.name}" exceeds 20 MB and was skipped.`);
            return false;
          }
          return true;
        })
        .map((f) => ({
          id: crypto.randomUUID(),
          file: f,
          preview: URL.createObjectURL(f),
        }));

      setImages((prev) => [...prev, ...newImages]);
    },
    [images.length],
  );

  const onDrop = useCallback(
    (accepted: File[]) => {
      if (accepted.length === 0) return;
      addImages(accepted);
    },
    [addImages],
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_FILE_SIZE,
    noClick: images.length > 0,
    noKeyboard: images.length > 0,
  });

  const removeImage = (id: string) => {
    setImages((prev) => {
      const item = prev.find((img) => img.id === id);
      if (item) URL.revokeObjectURL(item.preview);
      return prev.filter((img) => img.id !== id);
    });
  };

  /* ── Drag-to-reorder (HTML5 native) ── */
  const handleDragStart = (e: DragEvent<HTMLDivElement>, index: number) => {
    dragItemRef.current = index;
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    dragOverItemRef.current = index;
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (dragItemRef.current === null || dragOverItemRef.current === null) return;
    if (dragItemRef.current === dragOverItemRef.current) {
      dragItemRef.current = null;
      dragOverItemRef.current = null;
      return;
    }

    setImages((prev) => {
      const updated = [...prev];
      const [dragged] = updated.splice(dragItemRef.current!, 1);
      updated.splice(dragOverItemRef.current!, 0, dragged);
      return updated;
    });

    dragItemRef.current = null;
    dragOverItemRef.current = null;
  };

  /* ── Create PDF ── */
  const createPdf = async () => {
    if (images.length === 0) return;
    setStage("converting");
    setProgress(0);
    setError(null);

    try {
      // Simulate initial progress
      setProgress(10);

      const fd = new FormData();
      for (const img of images) {
        fd.append("files", img.file);
      }
      fd.append("pageSize", pageSize);
      fd.append("orientation", orientation);
      fd.append("margin", "medium");

      setProgress(30);

      const res = await fetch("/api/tools/image-to-pdf", {
        method: "POST",
        body: fd,
      });

      setProgress(70);

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Conversion failed" }));
        setError(data.error || "Failed to create PDF");
        setStage("upload");
        return;
      }

      setProgress(90);

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      setProgress(100);
      setStage("done");
    } catch {
      setError("Conversion failed. Please try again.");
      setStage("upload");
    }
  };

  const downloadPdf = () => {
    if (!resultUrl) return;
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = "images.pdf";
    a.click();
  };

  const reset = () => {
    images.forEach((img) => URL.revokeObjectURL(img.preview));
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setImages([]);
    setResultUrl(null);
    setStage("upload");
    setError(null);
    setProgress(0);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ─── STAGE 1: Upload ─── */}
      {stage === "upload" && (
        <div className="max-w-4xl mx-auto px-4 py-16">
          {/* Hero */}
          <div className="text-center space-y-3 mb-10">
            <h1 className="text-4xl font-extrabold text-foreground">Image to PDF</h1>
            <p className="text-muted max-w-lg mx-auto">
              Combine multiple images into a single PDF document.
            </p>
          </div>

          {/* Drop zone */}
          {images.length === 0 ? (
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
                {isDragActive ? "Drop images here" : "Select images"}
              </p>
              <p className="text-sm text-muted">or drag and drop them here</p>
              <p className="text-xs text-muted mt-3">JPG, PNG, WEBP, GIF. Up to 20 MB each. Max {MAX_IMAGES} files.</p>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto space-y-6">
              {/* Draggable thumbnail grid */}
              <div {...getRootProps()} className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                <input {...getInputProps()} />
                {images.map((img, i) => (
                  <div
                    key={img.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, i)}
                    onDragOver={(e) => handleDragOver(e, i)}
                    onDrop={handleDrop}
                    className="relative group cursor-grab active:cursor-grabbing"
                  >
                    <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 border border-border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.preview} alt={img.file.name} className="w-full h-full object-cover" />
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeImage(img.id); }}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={10} />
                    </button>
                    <p className="text-[9px] text-muted text-center mt-1 truncate">
                      Page {i + 1} &middot; {fmtBytes(img.file.size)}
                    </p>
                  </div>
                ))}

                {/* Add more button */}
                {images.length < MAX_IMAGES && (
                  <button
                    onClick={(e) => { e.stopPropagation(); open(); }}
                    className="aspect-square rounded-xl border-2 border-dashed border-border hover:border-primary/60 flex flex-col items-center justify-center gap-1 transition-colors"
                  >
                    <Plus size={20} className="text-muted" />
                    <span className="text-[10px] text-muted">Add</span>
                  </button>
                )}
              </div>

              <p className="text-xs text-muted text-center">
                {images.length} image{images.length !== 1 ? "s" : ""} selected &middot; Drag to reorder
              </p>

              {/* Controls */}
              <div className="space-y-4">
                {/* Page Size pills */}
                <div>
                  <span className="text-xs font-semibold text-foreground mb-2 block">Page Size</span>
                  <div className="flex gap-2">
                    {(
                      [
                        { key: "a4", label: "A4" },
                        { key: "letter", label: "Letter" },
                        { key: "fit", label: "Fit to Image" },
                      ] as { key: PageSize; label: string }[]
                    ).map((ps) => (
                      <button
                        key={ps.key}
                        onClick={() => setPageSize(ps.key)}
                        className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                          pageSize === ps.key
                            ? "bg-primary text-white"
                            : "bg-card border border-border text-foreground hover:border-primary/40"
                        }`}
                      >
                        {ps.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Orientation pills */}
                <div>
                  <span className="text-xs font-semibold text-foreground mb-2 block">Orientation</span>
                  <div className="flex gap-2">
                    {(
                      [
                        { key: "portrait", label: "Portrait" },
                        { key: "landscape", label: "Landscape" },
                      ] as { key: Orientation; label: string }[]
                    ).map((o) => (
                      <button
                        key={o.key}
                        onClick={() => setOrientation(o.key)}
                        className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                          orientation === o.key
                            ? "bg-primary text-white"
                            : "bg-card border border-border text-foreground hover:border-primary/40"
                        }`}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Create PDF button */}
              <button
                onClick={createPdf}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary text-white text-base font-bold rounded-2xl hover:bg-primary-hover transition-colors shadow-lg"
              >
                <FileImage size={18} />
                Create PDF
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

      {/* ─── STAGE 2: Converting ─── */}
      {stage === "converting" && (
        <div className="max-w-md mx-auto px-4 py-32 text-center space-y-6">
          <Loader2 size={48} className="animate-spin text-primary mx-auto" />
          <div>
            <h2 className="text-xl font-bold text-foreground mb-1">Creating PDF...</h2>
            <p className="text-sm text-muted">
              Combining {images.length} image{images.length !== 1 ? "s" : ""} into one PDF
            </p>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* ─── STAGE 3: Done ─── */}
      {stage === "done" && resultUrl && (
        <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">
          {/* Success card */}
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center space-y-2">
            <CheckCircle2 size={40} className="text-green-500 mx-auto" />
            <h2 className="text-xl font-bold text-foreground">
              PDF created successfully
            </h2>
            <p className="text-sm text-green-700">
              {images.length} image{images.length !== 1 ? "s" : ""} combined into one PDF
            </p>
          </div>

          {/* Download button */}
          <button
            onClick={downloadPdf}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary text-white text-base font-bold rounded-2xl hover:bg-primary-hover transition-colors shadow-lg"
          >
            <Download size={18} />
            Download PDF
          </button>

          {/* Start over */}
          <button
            onClick={reset}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-muted border border-border rounded-xl hover:border-primary/40 transition-colors"
          >
            Create Another PDF
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
                  { step: "1", title: "Upload", desc: "Select one or more images from your device" },
                  { step: "2", title: "Arrange", desc: "Drag to reorder, pick page size & orientation" },
                  { step: "3", title: "Download", desc: "Get your combined PDF in seconds" },
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
                { label: "JPG, PNG, WEBP, GIF", sub: "All formats" },
                { label: "Up to 20 images", sub: "Batch convert" },
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
