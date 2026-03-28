"use client";

import { useState, useCallback, useRef } from "react";
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Crop as CropIcon, Upload, Download, Loader2, X, Minimize2, Maximize2, Wand2 } from "lucide-react";
import Link from "next/link";
import UpgradeModal from "@/app/components/UpgradeModal";

const ASPECT_PRESETS = [
  { label: "Free",    value: undefined },
  { label: "1:1",     value: 1 },
  { label: "4:3",     value: 4 / 3 },
  { label: "16:9",    value: 16 / 9 },
  { label: "3:2",     value: 3 / 2 },
  { label: "2:3",     value: 2 / 3 },
  { label: "9:16",    value: 9 / 16 },
];

function centerAspectCrop(w: number, h: number, aspect: number): Crop {
  return centerCrop(makeAspectCrop({ unit: "%", width: 90 }, aspect, w, h), w, h);
}

export default function CropPage() {
  const [imgSrc,      setImgSrc]      = useState("");
  const [fileName,    setFileName]    = useState("image");
  const [crop,        setCrop]        = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [aspect,      setAspect]      = useState<number | undefined>(undefined);
  const [processing,  setProcessing]  = useState(false);
  const [resultUrl,   setResultUrl]   = useState("");
  const [resultName,  setResultName]  = useState("");
  const [error,       setError]       = useState("");
  const [showUpgrade, setShowUpgrade] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const fileRef = useRef<File | null>(null);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    fileRef.current = file;
    setFileName(file.name.replace(/\.[^.]+$/, ""));
    setResultUrl("");
    const reader = new FileReader();
    reader.onload = () => setImgSrc(reader.result as string);
    reader.readAsDataURL(file);
  };

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
    const initial = aspect
      ? centerAspectCrop(w, h, aspect)
      : centerCrop({ unit: "%", width: 80, height: 80 }, w, h);
    setCrop(initial);
  };

  const changeAspect = (a: number | undefined) => {
    setAspect(a);
    if (imgRef.current && a !== undefined) {
      const { naturalWidth: w, naturalHeight: h } = imgRef.current;
      setCrop(centerAspectCrop(w, h, a));
    }
  };

  const handleCrop = async () => {
    if (!completedCrop || !fileRef.current) return;
    setProcessing(true);
    setError("");

    try {
      const fd = new FormData();
      fd.append("file", fileRef.current);
      fd.append("left",   String(Math.round(completedCrop.x)));
      fd.append("top",    String(Math.round(completedCrop.y)));
      fd.append("width",  String(Math.round(completedCrop.width)));
      fd.append("height", String(Math.round(completedCrop.height)));

      const res = await fetch("/api/tools/crop", { method: "POST", body: fd });
      if (!res.ok) {
        const data = await res.json();
        if (data.code === "RATE_LIMIT") { setShowUpgrade(true); return; }
        setError(data.error || "Crop failed");
        return;
      }

      const blob = await res.blob();
      const ext  = fileRef.current.name.split(".").pop() || "jpg";
      setResultUrl(URL.createObjectURL(blob));
      setResultName(`${fileName}-cropped.${ext}`);
    } catch {
      setError("Crop failed. Please try again.");
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
            <CropIcon size={12} /> CROP IMAGE
          </div>
          <h1 className="text-3xl font-extrabold text-foreground">Crop Images Online</h1>
          <p className="text-muted max-w-md mx-auto text-sm">
            Trim, crop, and cut images to any size. Drag to select the region you want.
          </p>
        </div>

        {/* Upload */}
        {!imgSrc && (
          <label className="block border-2 border-dashed border-border rounded-2xl p-10 text-center cursor-pointer hover:border-primary/60 hover:bg-primary-light/30 transition-all">
            <input type="file" accept="image/*" className="hidden" onChange={onFileChange} />
            <Upload size={32} className="mx-auto mb-3 text-muted" />
            <p className="font-semibold text-foreground">Click to upload an image</p>
            <p className="text-xs text-muted mt-1">JPG, PNG, WEBP, GIF · Up to 10 MB</p>
          </label>
        )}

        {imgSrc && (
          <>
            {/* Aspect presets */}
            <div className="bg-card border border-border rounded-2xl p-4">
              <p className="text-xs font-bold text-muted uppercase tracking-wider mb-3">Aspect Ratio</p>
              <div className="flex flex-wrap gap-2">
                {ASPECT_PRESETS.map((p) => (
                  <button key={p.label} onClick={() => changeAspect(p.value)}
                    className={`px-3 py-1 rounded-lg border text-xs font-semibold transition-colors ${
                      aspect === p.value
                        ? "border-primary bg-primary-light text-primary"
                        : "border-border text-muted hover:border-primary/40 hover:text-foreground"
                    }`}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Crop editor */}
            <div className="bg-card border border-border rounded-2xl p-4 overflow-hidden">
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={aspect}
                className="max-w-full"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={imgRef}
                  src={imgSrc}
                  alt="Crop preview"
                  onLoad={onImageLoad}
                  className="max-w-full max-h-[500px] object-contain"
                />
              </ReactCrop>
            </div>

            {/* Info */}
            {completedCrop && (
              <p className="text-xs text-muted text-center">
                Selection: {Math.round(completedCrop.width)} × {Math.round(completedCrop.height)} px
              </p>
            )}

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button onClick={handleCrop} disabled={processing || !completedCrop}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {processing ? <Loader2 size={15} className="animate-spin" /> : <CropIcon size={15} />}
                {processing ? "Cropping…" : "Apply Crop"}
              </button>
              <button onClick={() => { setImgSrc(""); setResultUrl(""); setCrop(undefined); fileRef.current = null; }}
                className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-xl text-sm text-muted hover:text-foreground hover:border-foreground/30 transition-colors">
                <X size={14} /> Clear
              </button>
            </div>

            {resultUrl && (
              <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={resultUrl} alt="Cropped" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{resultName}</p>
                  <p className="text-xs text-muted mt-0.5">Ready to download</p>
                </div>
                <a href={resultUrl} download={resultName}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary-hover transition-colors flex-shrink-0">
                  <Download size={13} /> Download
                </a>
              </div>
            )}
          </>
        )}

        {/* Related Tools */}
        <div>
          <h3 className="text-sm font-bold text-muted uppercase tracking-wider mb-3">Related Tools</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { href: "/tools/resize",         icon: Maximize2, label: "Resize" },
              { href: "/tools/compress",       icon: Minimize2, label: "Compress" },
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
