"use client";

import { useState, useCallback, useRef, DragEvent } from "react";
import { useDropzone } from "react-dropzone";
import {
  FileImage,
  Upload,
  Download,
  X,
  Loader2,
  GripVertical,
  AlertCircle,
  Zap,
  Minimize2,
  Maximize2,
  Crop,
  Wand2,
} from "lucide-react";
import Link from "next/link";
import UpgradeModal from "@/app/components/UpgradeModal";

type PageSize = "a4" | "letter" | "fit";
type Orientation = "portrait" | "landscape";
type Margin = "none" | "small" | "medium" | "large";

interface ImageFile {
  id: string;
  file: File;
  preview: string;
}

const PAGE_SIZES: { key: PageSize; label: string; desc: string }[] = [
  { key: "a4", label: "A4", desc: "210 x 297 mm" },
  { key: "letter", label: "Letter", desc: "8.5 x 11 in" },
  { key: "fit", label: "Fit to Image", desc: "Match image" },
];

const ORIENTATIONS: { key: Orientation; label: string }[] = [
  { key: "portrait", label: "Portrait" },
  { key: "landscape", label: "Landscape" },
];

const MARGINS: { key: Margin; label: string }[] = [
  { key: "none", label: "None" },
  { key: "small", label: "Small" },
  { key: "medium", label: "Medium" },
  { key: "large", label: "Large" },
];

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB
const MAX_IMAGES = 20;
const ACCEPTED_TYPES: Record<string, string[]> = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
  "image/gif": [".gif"],
};

export default function ImageToPdfPage() {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [pageSize, setPageSize] = useState<PageSize>("a4");
  const [orientation, setOrientation] = useState<Orientation>("portrait");
  const [margin, setMargin] = useState<Margin>("medium");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);

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
    (acceptedFiles: File[]) => {
      addImages(acceptedFiles);
    },
    [addImages],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_FILE_SIZE,
  });

  const removeImage = (id: string) => {
    setImages((prev) => {
      const item = prev.find((img) => img.id === id);
      if (item) URL.revokeObjectURL(item.preview);
      return prev.filter((img) => img.id !== id);
    });
  };

  // --- Drag & drop reorder handlers ---
  const handleDragStart = (index: number) => {
    dragItemRef.current = index;
  };

  const handleDragEnter = (index: number) => {
    dragOverItemRef.current = index;
  };

  const handleDragEnd = () => {
    if (dragItemRef.current === null || dragOverItemRef.current === null) return;
    if (dragItemRef.current === dragOverItemRef.current) {
      dragItemRef.current = null;
      dragOverItemRef.current = null;
      return;
    }

    setImages((prev) => {
      const updated = [...prev];
      const [draggedItem] = updated.splice(dragItemRef.current!, 1);
      updated.splice(dragOverItemRef.current!, 0, draggedItem);
      return updated;
    });

    dragItemRef.current = null;
    dragOverItemRef.current = null;
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  // --- Convert to PDF ---
  const convertToPdf = async () => {
    if (images.length === 0) return;
    setProcessing(true);
    setError(null);

    try {
      const fd = new FormData();
      for (const img of images) {
        fd.append("files", img.file);
      }
      fd.append("pageSize", pageSize);
      fd.append("orientation", orientation);
      fd.append("margin", margin);

      const res = await fetch("/api/tools/image-to-pdf", {
        method: "POST",
        body: fd,
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

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "images.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Conversion failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-10">
      <div className="max-w-3xl mx-auto px-4 space-y-8">
        {/* Hero */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 bg-primary-light text-primary text-xs font-bold px-3 py-1 rounded-full mb-2">
            <FileImage size={12} /> IMAGE TO PDF
          </div>
          <h1 className="text-3xl font-extrabold text-foreground">
            Convert Images to PDF
          </h1>
          <p className="text-muted max-w-md mx-auto text-sm">
            Combine multiple images into a single PDF document. Supports JPG, PNG, WEBP, and GIF.
          </p>
        </div>

        {/* Controls */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
          {/* Page Size */}
          <div>
            <span className="text-sm font-semibold text-foreground mb-2 block">
              Page Size
            </span>
            <div className="grid grid-cols-3 gap-2">
              {PAGE_SIZES.map((ps) => (
                <button
                  key={ps.key}
                  onClick={() => setPageSize(ps.key)}
                  className={`p-2 rounded-xl border text-center transition-all ${
                    pageSize === ps.key
                      ? "border-primary bg-primary-light"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <div
                    className={`text-xs font-bold ${
                      pageSize === ps.key ? "text-primary" : "text-foreground"
                    }`}
                  >
                    {ps.label}
                  </div>
                  <div className="text-[10px] text-muted">{ps.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Orientation */}
          <div>
            <span className="text-sm font-semibold text-foreground mb-2 block">
              Orientation
            </span>
            <div className="grid grid-cols-2 gap-2">
              {ORIENTATIONS.map((o) => (
                <button
                  key={o.key}
                  onClick={() => setOrientation(o.key)}
                  className={`p-2 rounded-xl border text-center transition-all ${
                    orientation === o.key
                      ? "border-primary bg-primary-light"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <div
                    className={`text-xs font-bold ${
                      orientation === o.key ? "text-primary" : "text-foreground"
                    }`}
                  >
                    {o.label}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Margin */}
          <div>
            <span className="text-sm font-semibold text-foreground mb-2 block">
              Margin
            </span>
            <div className="grid grid-cols-4 gap-2">
              {MARGINS.map((m) => (
                <button
                  key={m.key}
                  onClick={() => setMargin(m.key)}
                  className={`p-2 rounded-xl border text-center transition-all ${
                    margin === m.key
                      ? "border-primary bg-primary-light"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <div
                    className={`text-xs font-bold ${
                      margin === m.key ? "text-primary" : "text-foreground"
                    }`}
                  >
                    {m.label}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Drop zone */}
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
            {isDragActive ? "Drop images here" : "Drag & drop images or click to browse"}
          </p>
          <p className="text-xs text-muted mt-1">
            JPG, PNG, WEBP, GIF · Up to 20 MB each · Max {MAX_IMAGES} images
          </p>
        </div>

        {/* Image list (sortable) */}
        {images.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-foreground">
                Images ({images.length})
              </h2>
              {images.length > 1 && (
                <p className="text-[11px] text-muted">
                  Drag to reorder
                </p>
              )}
            </div>

            {images.map((img, index) => (
              <div
                key={img.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragEnter={() => handleDragEnter(index)}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4 cursor-grab active:cursor-grabbing"
              >
                <GripVertical size={16} className="text-muted flex-shrink-0" />

                <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.preview}
                    alt={img.file.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {img.file.name}
                  </p>
                  <p className="text-xs text-muted mt-0.5">
                    {(img.file.size / 1024).toFixed(1)} KB
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-muted font-medium">
                    Page {index + 1}
                  </span>
                  <button
                    onClick={() => removeImage(img.id)}
                    className="p-1.5 text-muted hover:text-red-500 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}

            {/* Convert button */}
            <button
              onClick={convertToPdf}
              disabled={processing || images.length === 0}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Creating PDF...
                </>
              ) : (
                <>
                  <Download size={16} />
                  Convert to PDF & Download
                </>
              )}
            </button>
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
              How it works
            </h3>
          </div>
          <p className="text-sm text-muted leading-relaxed">
            Upload your images and arrange them in the order you want. Choose your preferred page
            size, orientation, and margin. Each image is placed on its own page in the resulting PDF.
            Files are processed on our server and never stored.
          </p>
        </div>

        {/* Related Tools */}
        <div>
          <h3 className="text-sm font-bold text-muted uppercase tracking-wider mb-3">
            Related Tools
          </h3>
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
