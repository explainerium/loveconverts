"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  Upload, Type, Plus, X, Download, Package, Bold, Italic, Underline,
  AlignLeft, AlignCenter, AlignRight, Keyboard, ChevronDown,
  ImagePlus, Image as ImageIcon, Loader2,
} from "lucide-react";
import JSZip from "jszip";
// We load fabric dynamically inside useEffect to be extra safe with SSR
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Fabric = any;

/* ──────── Types ──────── */

interface TextLayer {
  id: string;
  text: string;
  fontFamily: string;
  fontSize: number;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  align: "left" | "center" | "right";
  color: string;
  opacity: number;
  bgMode: "none" | "solid" | "semi";
  bgColor: string;
  bgPadding: number;
  strokeEnabled: boolean;
  strokeColor: string;
  strokeWidth: number;
  shadowEnabled: boolean;
  shadowColor: string;
  shadowOpacity: number;
  shadowBlur: number;
  shadowX: number;
  shadowY: number;
  letterSpacing: number;
  lineHeight: number;
  rotation: number;
  left: number;
  top: number;
}

interface FontGroup {
  label: string;
  fonts: string[];
}

/* ──────── Font Groups ──────── */

const FONT_GROUPS: FontGroup[] = [
  {
    label: "Sans-Serif",
    fonts: [
      "Inter", "Roboto", "Open Sans", "Montserrat", "Poppins", "Lato",
      "Nunito", "Raleway", "Source Sans 3", "DM Sans", "Plus Jakarta Sans", "Outfit",
    ],
  },
  {
    label: "Serif",
    fonts: [
      "Playfair Display", "Merriweather", "Lora", "EB Garamond",
      "Cormorant", "DM Serif Display", "Libre Baskerville",
    ],
  },
  {
    label: "Display",
    fonts: ["Oswald", "Anton", "Bebas Neue", "Black Han Sans", "Righteous", "Squada One"],
  },
  {
    label: "Handwriting",
    fonts: ["Pacifico", "Dancing Script", "Caveat", "Satisfy", "Sacramento", "Great Vibes"],
  },
  {
    label: "Monospace",
    fonts: ["JetBrains Mono", "Source Code Pro", "Space Mono", "Courier Prime"],
  },
];

const ALL_FONTS = FONT_GROUPS.flatMap((g) => g.fonts);

/* ──────── Default Layer ──────── */

const createDefaultLayer = (): TextLayer => ({
  id: crypto.randomUUID(),
  text: "Your text here",
  fontFamily: "Inter",
  fontSize: 36,
  bold: false,
  italic: false,
  underline: false,
  align: "center",
  color: "#FFFFFF",
  opacity: 100,
  bgMode: "none",
  bgColor: "#000000",
  bgPadding: 12,
  strokeEnabled: false,
  strokeColor: "#000000",
  strokeWidth: 2,
  shadowEnabled: false,
  shadowColor: "#000000",
  shadowOpacity: 60,
  shadowBlur: 4,
  shadowX: 2,
  shadowY: 2,
  letterSpacing: 0,
  lineHeight: 1.4,
  rotation: 0,
  left: 0.5,
  top: 0.9,
});

/* ──────── Quick Presets ──────── */

const PRESETS: { name: string; apply: (layer: TextLayer) => TextLayer }[] = [
  {
    name: "White Caption Bar",
    apply: (l) => ({
      ...l,
      fontFamily: "Inter",
      fontSize: 32,
      bold: true,
      color: "#FFFFFF",
      bgMode: "semi",
      bgColor: "#000000",
      bgPadding: 14,
      strokeEnabled: false,
      shadowEnabled: false,
      left: 0.5,
      top: 0.9,
    }),
  },
  {
    name: "Subtle Watermark",
    apply: (l) => ({
      ...l,
      fontFamily: "Inter",
      fontSize: 20,
      color: "#FFFFFF",
      opacity: 40,
      bgMode: "none",
      strokeEnabled: false,
      shadowEnabled: false,
      left: 0.85,
      top: 0.93,
    }),
  },
  {
    name: "Bold Title",
    apply: (l) => ({
      ...l,
      fontFamily: "Oswald",
      fontSize: 64,
      bold: true,
      color: "#FFFFFF",
      bgMode: "none",
      shadowEnabled: true,
      shadowColor: "#000000",
      shadowOpacity: 80,
      shadowBlur: 8,
      shadowX: 2,
      shadowY: 4,
      left: 0.5,
      top: 0.5,
    }),
  },
  {
    name: "Corner Label",
    apply: (l) => ({
      ...l,
      fontFamily: "Inter",
      fontSize: 24,
      bold: true,
      color: "#FFFFFF",
      bgMode: "solid",
      bgColor: "#FF4747",
      bgPadding: 16,
      strokeEnabled: false,
      shadowEnabled: false,
      left: 0.15,
      top: 0.1,
    }),
  },
  {
    name: "Meme Style",
    apply: (l) => ({
      ...l,
      fontFamily: "Anton",
      fontSize: 52,
      bold: false,
      color: "#FFFFFF",
      bgMode: "none",
      strokeEnabled: true,
      strokeColor: "#000000",
      strokeWidth: 3,
      shadowEnabled: false,
      left: 0.5,
      top: 0.9,
    }),
  },
  {
    name: "Minimal Signature",
    apply: (l) => ({
      ...l,
      fontFamily: "Dancing Script",
      fontSize: 28,
      color: "#FFFFFF",
      opacity: 80,
      bgMode: "none",
      strokeEnabled: false,
      shadowEnabled: false,
      left: 0.85,
      top: 0.93,
    }),
  },
];

/* ──────── Load Google Font helper ──────── */

const loadedFonts = new Set<string>(["Inter"]);
async function ensureFont(family: string) {
  if (loadedFonts.has(family)) return;
  const url = `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, "+")}:wght@400;700&display=swap`;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = url;
  document.head.appendChild(link);
  try {
    await document.fonts.load(`400 16px "${family}"`);
    await document.fonts.load(`700 16px "${family}"`);
  } catch {}
  loadedFonts.add(family);
}

/* ──────── Component ──────── */

type Mode = "single" | "batch";
type OutputFormat = "png" | "jpg";

export default function AddTextEditor() {
  const [mode, setMode] = useState<Mode>("single");
  const [file, setFile] = useState<File | null>(null);
  const [batchFiles, setBatchFiles] = useState<File[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageDims, setImageDims] = useState<{ w: number; h: number } | null>(null);

  const [layers, setLayers] = useState<TextLayer[]>([createDefaultLayer()]);
  const [activeLayerId, setActiveLayerId] = useState<string>(layers[0].id);

  const [outputFormat, setOutputFormat] = useState<OutputFormat>("png");
  const [jpgQuality, setJpgQuality] = useState(90);

  const [showShortcuts, setShowShortcuts] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ done: number; total: number } | null>(null);

  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<Fabric>(null);
  const fabricLibRef = useRef<Fabric>(null);
  const fabricObjectMapRef = useRef<Map<string, Fabric>>(new Map());

  const activeLayer = layers.find((l) => l.id === activeLayerId) || layers[0];

  /* ── Dropzone ── */
  const onDrop = useCallback(
    (accepted: File[]) => {
      if (accepted.length === 0) return;
      if (mode === "single") {
        const f = accepted[0];
        setFile(f);
        const url = URL.createObjectURL(f);
        setImageUrl(url);
      } else {
        setBatchFiles((prev) => [...prev, ...accepted].slice(0, 30));
      }
    },
    [mode]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp"] },
    maxSize: 20 * 1024 * 1024,
    multiple: mode === "batch",
    noClick: mode === "single" && !!file,
    noKeyboard: mode === "single" && !!file,
  });

  /* ── Clipboard paste ── */
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          const blob = item.getAsFile();
          if (blob) {
            const ext = item.type.split("/")[1] || "png";
            const pastedFile = new File([blob], `pasted.${ext}`, { type: item.type });
            onDrop([pastedFile]);
          }
          break;
        }
      }
    };
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [onDrop]);

  /* ── Initialize Fabric canvas ── */
  useEffect(() => {
    if (mode !== "single" || !imageUrl || !canvasElRef.current) return;

    let cancelled = false;
    let canvas: Fabric = null;

    (async () => {
      const fabric = await import("fabric");
      if (cancelled) return;
      fabricLibRef.current = fabric;

      // Dispose previous canvas if present
      if (fabricCanvasRef.current) {
        try { fabricCanvasRef.current.dispose(); } catch {}
        fabricCanvasRef.current = null;
        fabricObjectMapRef.current.clear();
      }

      canvas = new fabric.Canvas(canvasElRef.current!, {
        backgroundColor: "#F1F5F9",
        preserveObjectStacking: true,
      });
      fabricCanvasRef.current = canvas;

      // Load image
      const img = await fabric.FabricImage.fromURL(imageUrl, { crossOrigin: "anonymous" });
      if (cancelled) return;

      const imgW = img.width ?? 1000;
      const imgH = img.height ?? 1000;
      setImageDims({ w: imgW, h: imgH });

      // Fit canvas to container (max 700 wide)
      const maxW = 700;
      const scale = Math.min(1, maxW / imgW);
      const displayW = imgW * scale;
      const displayH = imgH * scale;
      canvas.setDimensions({ width: displayW, height: displayH });

      // Use backgroundImage (not add) so the image renders BELOW all objects
      // regardless of any race condition with the layers effect.
      img.scaleX = scale;
      img.scaleY = scale;
      img.set({ originX: "left", originY: "top", left: 0, top: 0 });
      canvas.backgroundImage = img;

      // Add initial text layers
      for (const layer of layers) {
        await ensureFont(layer.fontFamily);
        if (cancelled) return;
        const tb = createFabricText(fabric, layer, displayW, displayH);
        tb.set({ data: { layerId: layer.id } });
        canvas.add(tb);
        fabricObjectMapRef.current.set(layer.id, tb);
      }

      canvas.on("selection:created", (e: Fabric) => {
        const obj = e.selected?.[0];
        const lid = obj?.data?.layerId;
        if (lid) setActiveLayerId(lid);
      });
      canvas.on("selection:updated", (e: Fabric) => {
        const obj = e.selected?.[0];
        const lid = obj?.data?.layerId;
        if (lid) setActiveLayerId(lid);
      });
      canvas.on("object:modified", (e: Fabric) => {
        const obj = e.target;
        const lid = obj?.data?.layerId;
        if (!lid) return;
        const newLeft = obj.left / displayW;
        const newTop = obj.top / displayH;
        const newRotation = obj.angle || 0;
        setLayers((prev) =>
          prev.map((l) =>
            l.id === lid ? { ...l, left: newLeft, top: newTop, rotation: newRotation } : l
          )
        );
      });

      canvas.renderAll();
    })();

    return () => {
      cancelled = true;
      if (canvas) {
        try { canvas.dispose(); } catch {}
      }
      fabricCanvasRef.current = null;
      fabricObjectMapRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageUrl, mode]);

  /* ── Update fabric text objects when layers change ── */
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    const fabric = fabricLibRef.current;
    if (!canvas || !fabric) return;

    const displayW = canvas.getWidth();
    const displayH = canvas.getHeight();

    (async () => {
      for (const layer of layers) {
        await ensureFont(layer.fontFamily);
        let obj = fabricObjectMapRef.current.get(layer.id);
        if (!obj) {
          obj = createFabricText(fabric, layer, displayW, displayH);
          obj.set({ data: { layerId: layer.id } });
          canvas.add(obj);
          fabricObjectMapRef.current.set(layer.id, obj);
        } else {
          applyLayerToFabricText(fabric, obj, layer, displayW, displayH);
        }
      }
      // Remove deleted layers
      const layerIds = new Set(layers.map((l) => l.id));
      for (const [lid, obj] of fabricObjectMapRef.current.entries()) {
        if (!layerIds.has(lid)) {
          canvas.remove(obj);
          fabricObjectMapRef.current.delete(lid);
        }
      }
      canvas.renderAll();
    })();
  }, [layers]);

  /* ── Update active layer in a functional way ── */
  const updateActiveLayer = (patch: Partial<TextLayer>) => {
    setLayers((prev) => prev.map((l) => (l.id === activeLayerId ? { ...l, ...patch } : l)));
  };

  /* ── Layer management ── */
  const addLayer = () => {
    const newLayer = { ...createDefaultLayer(), text: "New text" };
    setLayers((prev) => [...prev, newLayer]);
    setActiveLayerId(newLayer.id);
  };

  const deleteLayer = (id: string) => {
    setLayers((prev) => {
      if (prev.length === 1) return prev;
      const filtered = prev.filter((l) => l.id !== id);
      if (id === activeLayerId) setActiveLayerId(filtered[0].id);
      return filtered;
    });
  };

  /* ── Reset ── */
  const reset = () => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setFile(null);
    setBatchFiles([]);
    setImageUrl(null);
    setImageDims(null);
    setLayers([createDefaultLayer()]);
    setBatchProgress(null);
    if (fabricCanvasRef.current) {
      try { fabricCanvasRef.current.dispose(); } catch {}
      fabricCanvasRef.current = null;
    }
    fabricObjectMapRef.current.clear();
  };

  /* ── Download single image ── */
  const downloadSingle = async () => {
    const canvas = fabricCanvasRef.current;
    const fabric = fabricLibRef.current;
    if (!canvas || !imageDims || !fabric) return;

    // Export at original resolution
    const scale = imageDims.w / canvas.getWidth();
    const dataUrl = canvas.toDataURL({
      format: outputFormat === "jpg" ? "jpeg" : "png",
      quality: jpgQuality / 100,
      multiplier: scale,
    });

    const base = (file?.name.replace(/\.[^/.]+$/, "") || "image").replace(/[^\x20-\x7E]/g, "").replace(/\s+/g, "_") || "image";
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `${base}-text.${outputFormat}`;
    a.click();
  };

  /* ── Batch render ── */
  const downloadBatch = async () => {
    if (batchFiles.length === 0) return;
    const fabric = await import("fabric");
    const zip = new JSZip();
    setBatchProgress({ done: 0, total: batchFiles.length });

    // Ensure fonts are loaded
    for (const layer of layers) {
      await ensureFont(layer.fontFamily);
    }

    for (let i = 0; i < batchFiles.length; i++) {
      const f = batchFiles[i];
      const url = URL.createObjectURL(f);

      try {
        const img = await fabric.FabricImage.fromURL(url);
        const w = img.width ?? 1000;
        const h = img.height ?? 1000;

        // Create off-screen canvas at native resolution
        const tmpEl = document.createElement("canvas");
        tmpEl.width = w;
        tmpEl.height = h;
        const tmpCanvas = new fabric.StaticCanvas(tmpEl, { width: w, height: h });
        img.set({ originX: "left", originY: "top", left: 0, top: 0 });
        tmpCanvas.backgroundImage = img;

        for (const layer of layers) {
          const tb = createFabricText(fabric, layer, w, h);
          tmpCanvas.add(tb);
        }

        tmpCanvas.renderAll();
        const dataUrl = tmpEl.toDataURL(
          outputFormat === "jpg" ? "image/jpeg" : "image/png",
          jpgQuality / 100
        );
        const base64 = dataUrl.split(",")[1];
        const base = (f.name.replace(/\.[^/.]+$/, "") || `image-${i}`).replace(/[^\x20-\x7E]/g, "").replace(/\s+/g, "_");
        zip.file(`${base}-text.${outputFormat}`, base64, { base64: true });

        tmpCanvas.dispose();
      } catch (err) {
        console.error("Batch error for", f.name, err);
      }

      URL.revokeObjectURL(url);
      setBatchProgress({ done: i + 1, total: batchFiles.length });
    }

    const blob = await zip.generateAsync({ type: "blob" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `loveconverts-text-${Date.now()}.zip`;
    link.click();
    URL.revokeObjectURL(link.href);
    setBatchProgress(null);
  };

  /* ── Keyboard shortcuts ── */
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;

      const mod = e.metaKey || e.ctrlKey;
      if (e.key === "Escape") {
        const canvas = fabricCanvasRef.current;
        if (canvas) { canvas.discardActiveObject(); canvas.renderAll(); }
        return;
      }
      if (mod && (e.key === "d" || e.key === "D")) {
        e.preventDefault();
        if (mode === "single") downloadSingle();
        else downloadBatch();
        return;
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        if (layers.length > 1 && fabricCanvasRef.current?.getActiveObject()) {
          e.preventDefault();
          deleteLayer(activeLayerId);
        }
        return;
      }
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        const canvas = fabricCanvasRef.current;
        const obj = canvas?.getActiveObject();
        if (!obj) return;
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        if (e.key === "ArrowUp") obj.top -= step;
        if (e.key === "ArrowDown") obj.top += step;
        if (e.key === "ArrowLeft") obj.left -= step;
        if (e.key === "ArrowRight") obj.left += step;
        obj.setCoords();
        canvas.renderAll();
        // Sync back to layer state
        const displayW = canvas.getWidth();
        const displayH = canvas.getHeight();
        const lid = obj.data?.layerId;
        if (lid) {
          setLayers((prev) =>
            prev.map((l) =>
              l.id === lid ? { ...l, left: obj.left / displayW, top: obj.top / displayH } : l
            )
          );
        }
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, layers, activeLayerId]);

  /* ── Position preset handler ── */
  const applyPosition = (col: 0 | 1 | 2, row: 0 | 1 | 2) => {
    const left = col === 0 ? 0.05 : col === 1 ? 0.5 : 0.95;
    const top = row === 0 ? 0.08 : row === 1 ? 0.5 : 0.92;
    updateActiveLayer({ left, top });
  };

  /* ── Apply preset to active layer ── */
  const applyPreset = (preset: typeof PRESETS[0]) => {
    setLayers((prev) => prev.map((l) => (l.id === activeLayerId ? preset.apply(l) : l)));
  };

  /* ──────── Render ──────── */

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Mode Selector */}
      <div className="max-w-md mx-auto mb-6 bg-card border border-border rounded-xl p-1 flex gap-1">
        <button
          onClick={() => { setMode("single"); reset(); }}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-colors ${
            mode === "single" ? "bg-primary text-white" : "text-muted hover:text-foreground"
          }`}
        >
          Single Image
        </button>
        <button
          onClick={() => { setMode("batch"); reset(); }}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-colors ${
            mode === "batch" ? "bg-primary text-white" : "text-muted hover:text-foreground"
          }`}
        >
          Batch Mode
        </button>
      </div>

      {/* Upload stage (no file yet) */}
      {((mode === "single" && !file) || (mode === "batch" && batchFiles.length === 0)) && (
        <div className="max-w-xl mx-auto">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-3xl p-16 text-center cursor-pointer transition-all ${
              isDragActive ? "border-primary bg-primary-light" : "border-border hover:border-primary/60 hover:bg-primary-light/30"
            }`}
          >
            <input {...getInputProps()} />
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Upload size={28} className="text-primary" />
            </div>
            <p className="font-bold text-foreground text-lg mb-1">
              {isDragActive ? "Drop here" : mode === "batch" ? "Select images" : "Select an image"}
            </p>
            <p className="text-sm text-muted">or drag and drop</p>
            <p className="text-xs text-muted mt-3">JPG, PNG, WEBP, GIF, BMP. Up to 20 MB.</p>
            <p className="text-[11px] text-muted/60 mt-2">You can also paste an image - Ctrl+V / Cmd+V</p>
          </div>
          {mode === "batch" && (
            <p className="text-xs text-muted text-center mt-3">
              All images will get the same text. Download as ZIP when done.
            </p>
          )}
        </div>
      )}

      {/* Editor / Batch view */}
      {((mode === "single" && file) || (mode === "batch" && batchFiles.length > 0)) && (
        <div className="grid lg:grid-cols-5 gap-6">
          {/* ── LEFT: Controls (2/5) ── */}
          <div className="lg:col-span-2 space-y-4">
            {/* Batch file list */}
            {mode === "batch" && (
              <div className="bg-card border border-border rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold text-foreground">{batchFiles.length} images loaded</p>
                  <button
                    onClick={() => setBatchFiles([])}
                    className="text-xs text-muted hover:text-red-500"
                  >
                    Clear
                  </button>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {batchFiles.slice(0, 10).map((f, i) => (
                    <div key={i} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                  <button
                    onClick={() => open()}
                    className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary/60 flex items-center justify-center"
                  >
                    <Plus size={16} className="text-muted" />
                  </button>
                </div>
              </div>
            )}

            {/* Text Layers */}
            <div className="bg-card border border-border rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-muted uppercase tracking-wider">Text Layers</p>
                <button
                  onClick={addLayer}
                  className="flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                >
                  <Plus size={11} /> Add
                </button>
              </div>
              <div className="space-y-1.5">
                {layers.map((layer) => (
                  <div
                    key={layer.id}
                    onClick={() => setActiveLayerId(layer.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                      layer.id === activeLayerId ? "bg-primary/10 border border-primary/30" : "bg-gray-50 hover:bg-gray-100"
                    }`}
                  >
                    <Type size={12} className={layer.id === activeLayerId ? "text-primary" : "text-muted"} />
                    <span className={`flex-1 text-xs truncate ${layer.id === activeLayerId ? "text-foreground font-semibold" : "text-muted"}`}>
                      {layer.text.slice(0, 20) || "Empty"}
                    </span>
                    {layers.length > 1 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteLayer(layer.id); }}
                        className="text-muted hover:text-red-500"
                      >
                        <X size={11} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Text Content */}
            <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
              <label className="text-xs font-bold text-muted uppercase tracking-wider">Text</label>
              <textarea
                value={activeLayer.text}
                onChange={(e) => updateActiveLayer({ text: e.target.value })}
                placeholder="Type your text here..."
                rows={3}
                className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background resize-none"
              />
            </div>

            {/* Font */}
            <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
              <label className="text-xs font-bold text-muted uppercase tracking-wider">Font</label>

              <select
                value={activeLayer.fontFamily}
                onChange={(e) => updateActiveLayer({ fontFamily: e.target.value })}
                className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {FONT_GROUPS.map((g) => (
                  <optgroup key={g.label} label={g.label}>
                    {g.fonts.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </optgroup>
                ))}
              </select>

              {/* Size */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-muted">Size</span>
                  <input
                    type="number"
                    value={activeLayer.fontSize}
                    onChange={(e) => updateActiveLayer({ fontSize: Math.max(8, Math.min(200, parseInt(e.target.value) || 36)) })}
                    className="w-16 text-xs border border-border rounded-md px-2 py-0.5 bg-background"
                  />
                </div>
                <input
                  type="range"
                  min={8}
                  max={200}
                  value={activeLayer.fontSize}
                  onChange={(e) => updateActiveLayer({ fontSize: parseInt(e.target.value) })}
                  className="custom-range w-full"
                />
              </div>

              {/* Style buttons */}
              <div className="flex gap-1.5">
                <button
                  onClick={() => updateActiveLayer({ bold: !activeLayer.bold })}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${activeLayer.bold ? "bg-primary text-white" : "bg-gray-100 text-foreground hover:bg-gray-200"}`}
                >
                  <Bold size={14} className="mx-auto" />
                </button>
                <button
                  onClick={() => updateActiveLayer({ italic: !activeLayer.italic })}
                  className={`flex-1 py-2 rounded-lg transition-colors ${activeLayer.italic ? "bg-primary text-white" : "bg-gray-100 text-foreground hover:bg-gray-200"}`}
                >
                  <Italic size={14} className="mx-auto" />
                </button>
                <button
                  onClick={() => updateActiveLayer({ underline: !activeLayer.underline })}
                  className={`flex-1 py-2 rounded-lg transition-colors ${activeLayer.underline ? "bg-primary text-white" : "bg-gray-100 text-foreground hover:bg-gray-200"}`}
                >
                  <Underline size={14} className="mx-auto" />
                </button>
              </div>

              {/* Alignment */}
              <div className="flex gap-1.5">
                <button
                  onClick={() => updateActiveLayer({ align: "left" })}
                  className={`flex-1 py-2 rounded-lg transition-colors ${activeLayer.align === "left" ? "bg-primary text-white" : "bg-gray-100 hover:bg-gray-200"}`}
                >
                  <AlignLeft size={14} className="mx-auto" />
                </button>
                <button
                  onClick={() => updateActiveLayer({ align: "center" })}
                  className={`flex-1 py-2 rounded-lg transition-colors ${activeLayer.align === "center" ? "bg-primary text-white" : "bg-gray-100 hover:bg-gray-200"}`}
                >
                  <AlignCenter size={14} className="mx-auto" />
                </button>
                <button
                  onClick={() => updateActiveLayer({ align: "right" })}
                  className={`flex-1 py-2 rounded-lg transition-colors ${activeLayer.align === "right" ? "bg-primary text-white" : "bg-gray-100 hover:bg-gray-200"}`}
                >
                  <AlignRight size={14} className="mx-auto" />
                </button>
              </div>
            </div>

            {/* Color & Opacity */}
            <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
              <label className="text-xs font-bold text-muted uppercase tracking-wider">Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={activeLayer.color}
                  onChange={(e) => updateActiveLayer({ color: e.target.value })}
                  className="w-10 h-10 rounded-lg border border-border cursor-pointer"
                />
                <div className="flex gap-1.5 flex-1">
                  {["#FFFFFF", "#000000", "#FFD700", "#FF4444", "#44AAFF", "#44DD88"].map((c) => (
                    <button
                      key={c}
                      onClick={() => updateActiveLayer({ color: c })}
                      className={`w-7 h-7 rounded-md border ${activeLayer.color.toUpperCase() === c ? "ring-2 ring-primary" : "border-border"}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-muted">Opacity</span>
                  <span className="text-xs text-primary font-bold">{activeLayer.opacity}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={activeLayer.opacity}
                  onChange={(e) => updateActiveLayer({ opacity: parseInt(e.target.value) })}
                  className="custom-range w-full"
                />
              </div>

              <div>
                <p className="text-xs font-semibold text-muted mb-1.5">Background</p>
                <div className="flex gap-1.5">
                  {(["none", "solid", "semi"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => updateActiveLayer({ bgMode: m })}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors ${
                        activeLayer.bgMode === m ? "bg-primary text-white" : "bg-gray-100 hover:bg-gray-200"
                      }`}
                    >
                      {m === "semi" ? "Semi" : m}
                    </button>
                  ))}
                </div>
                {activeLayer.bgMode !== "none" && (
                  <div className="mt-3 space-y-2">
                    <input
                      type="color"
                      value={activeLayer.bgColor}
                      onChange={(e) => updateActiveLayer({ bgColor: e.target.value })}
                      className="w-10 h-10 rounded-lg border border-border cursor-pointer"
                    />
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-muted">Padding</span>
                        <span className="text-xs text-primary font-bold">{activeLayer.bgPadding}px</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={40}
                        value={activeLayer.bgPadding}
                        onChange={(e) => updateActiveLayer({ bgPadding: parseInt(e.target.value) })}
                        className="custom-range w-full"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Effects */}
            <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
              <label className="text-xs font-bold text-muted uppercase tracking-wider">Effects</label>

              {/* Outline */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-foreground">Outline</span>
                  <button
                    onClick={() => updateActiveLayer({ strokeEnabled: !activeLayer.strokeEnabled })}
                    className={`toggle-track ${activeLayer.strokeEnabled ? "bg-primary" : "bg-gray-300"}`}
                    aria-checked={activeLayer.strokeEnabled}
                  >
                    <span className="toggle-thumb" />
                  </button>
                </div>
                {activeLayer.strokeEnabled && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={activeLayer.strokeColor}
                        onChange={(e) => updateActiveLayer({ strokeColor: e.target.value })}
                        className="w-8 h-8 rounded-md border border-border cursor-pointer"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-muted">Width</span>
                          <span className="text-[11px] text-primary font-bold">{activeLayer.strokeWidth}px</span>
                        </div>
                        <input
                          type="range"
                          min={1}
                          max={10}
                          value={activeLayer.strokeWidth}
                          onChange={(e) => updateActiveLayer({ strokeWidth: parseInt(e.target.value) })}
                          className="custom-range w-full"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Shadow */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-foreground">Drop Shadow</span>
                  <button
                    onClick={() => updateActiveLayer({ shadowEnabled: !activeLayer.shadowEnabled })}
                    className={`toggle-track ${activeLayer.shadowEnabled ? "bg-primary" : "bg-gray-300"}`}
                    aria-checked={activeLayer.shadowEnabled}
                  >
                    <span className="toggle-thumb" />
                  </button>
                </div>
                {activeLayer.shadowEnabled && (
                  <div className="space-y-2">
                    <input
                      type="color"
                      value={activeLayer.shadowColor}
                      onChange={(e) => updateActiveLayer({ shadowColor: e.target.value })}
                      className="w-8 h-8 rounded-md border border-border cursor-pointer"
                    />
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <div className="flex justify-between"><span className="text-muted">Blur</span><span className="text-primary font-bold">{activeLayer.shadowBlur}</span></div>
                        <input type="range" min={0} max={20} value={activeLayer.shadowBlur} onChange={(e) => updateActiveLayer({ shadowBlur: parseInt(e.target.value) })} className="custom-range w-full" />
                      </div>
                      <div>
                        <div className="flex justify-between"><span className="text-muted">Opacity</span><span className="text-primary font-bold">{activeLayer.shadowOpacity}</span></div>
                        <input type="range" min={0} max={100} value={activeLayer.shadowOpacity} onChange={(e) => updateActiveLayer({ shadowOpacity: parseInt(e.target.value) })} className="custom-range w-full" />
                      </div>
                      <div>
                        <div className="flex justify-between"><span className="text-muted">X</span><span className="text-primary font-bold">{activeLayer.shadowX}</span></div>
                        <input type="range" min={-20} max={20} value={activeLayer.shadowX} onChange={(e) => updateActiveLayer({ shadowX: parseInt(e.target.value) })} className="custom-range w-full" />
                      </div>
                      <div>
                        <div className="flex justify-between"><span className="text-muted">Y</span><span className="text-primary font-bold">{activeLayer.shadowY}</span></div>
                        <input type="range" min={-20} max={20} value={activeLayer.shadowY} onChange={(e) => updateActiveLayer({ shadowY: parseInt(e.target.value) })} className="custom-range w-full" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Spacing */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-muted">Letter Spacing</span>
                  <span className="text-xs text-primary font-bold">{activeLayer.letterSpacing}</span>
                </div>
                <input
                  type="range"
                  min={-5}
                  max={30}
                  value={activeLayer.letterSpacing}
                  onChange={(e) => updateActiveLayer({ letterSpacing: parseInt(e.target.value) })}
                  className="custom-range w-full"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-muted">Line Height</span>
                  <span className="text-xs text-primary font-bold">{activeLayer.lineHeight.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min={0.8}
                  max={3}
                  step={0.1}
                  value={activeLayer.lineHeight}
                  onChange={(e) => updateActiveLayer({ lineHeight: parseFloat(e.target.value) })}
                  className="custom-range w-full"
                />
              </div>
            </div>

            {/* Position */}
            <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
              <label className="text-xs font-bold text-muted uppercase tracking-wider">Position</label>
              <div className="grid grid-cols-3 gap-1.5 max-w-[180px]">
                {[0, 1, 2].map((row) =>
                  [0, 1, 2].map((col) => {
                    const matchLeft = col === 0 ? 0.05 : col === 1 ? 0.5 : 0.95;
                    const matchTop = row === 0 ? 0.08 : row === 1 ? 0.5 : 0.92;
                    const active = Math.abs(activeLayer.left - matchLeft) < 0.01 && Math.abs(activeLayer.top - matchTop) < 0.01;
                    return (
                      <button
                        key={`${col}-${row}`}
                        onClick={() => applyPosition(col as 0 | 1 | 2, row as 0 | 1 | 2)}
                        className={`aspect-square rounded-md border-2 transition-colors ${active ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full mx-auto ${active ? "bg-primary" : "bg-muted"}`} />
                      </button>
                    );
                  })
                )}
              </div>
              <p className="text-[11px] text-muted/60">You can also drag text directly on the preview canvas.</p>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-muted">Rotation</span>
                  <input
                    type="number"
                    value={Math.round(activeLayer.rotation)}
                    onChange={(e) => updateActiveLayer({ rotation: parseInt(e.target.value) || 0 })}
                    className="w-14 text-xs border border-border rounded-md px-2 py-0.5 bg-background"
                  />
                </div>
                <input
                  type="range"
                  min={-180}
                  max={180}
                  value={activeLayer.rotation}
                  onChange={(e) => updateActiveLayer({ rotation: parseInt(e.target.value) })}
                  className="custom-range w-full"
                />
              </div>
            </div>

            {/* Presets */}
            <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
              <label className="text-xs font-bold text-muted uppercase tracking-wider">Quick Presets</label>
              <div className="grid grid-cols-2 gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.name}
                    onClick={() => applyPreset(p)}
                    className="py-2 px-3 rounded-lg border border-border hover:border-primary/40 hover:bg-primary-light/30 text-xs font-semibold text-foreground transition-colors text-left"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Output */}
            <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
              <label className="text-xs font-bold text-muted uppercase tracking-wider">Output</label>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setOutputFormat("png")}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${outputFormat === "png" ? "bg-primary text-white" : "bg-gray-100 hover:bg-gray-200"}`}
                >
                  PNG
                </button>
                <button
                  onClick={() => setOutputFormat("jpg")}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${outputFormat === "jpg" ? "bg-primary text-white" : "bg-gray-100 hover:bg-gray-200"}`}
                >
                  JPG
                </button>
              </div>
              {outputFormat === "jpg" && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-muted">Quality</span>
                    <span className="text-xs text-primary font-bold">{jpgQuality}%</span>
                  </div>
                  <input
                    type="range"
                    min={60}
                    max={100}
                    value={jpgQuality}
                    onChange={(e) => setJpgQuality(parseInt(e.target.value))}
                    className="custom-range w-full"
                  />
                </div>
              )}
            </div>

            {/* Keyboard shortcuts (collapsible) */}
            <button
              onClick={() => setShowShortcuts((s) => !s)}
              className="flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors"
            >
              <Keyboard size={12} />
              Keyboard shortcuts
              <ChevronDown size={11} className={`transition-transform ${showShortcuts ? "rotate-180" : ""}`} />
            </button>
            {showShortcuts && (
              <div className="bg-card border border-border rounded-xl p-3 grid grid-cols-2 gap-1.5 text-[11px]">
                {[
                  { k: "Ctrl+V / Cmd+V", a: "Paste image" },
                  { k: "Ctrl+D / Cmd+D", a: "Download" },
                  { k: "Escape", a: "Deselect text" },
                  { k: "Delete / Backspace", a: "Delete text layer" },
                  { k: "Arrow Keys", a: "Nudge 1px" },
                  { k: "Shift+Arrow", a: "Nudge 10px" },
                ].map((s) => (
                  <div key={s.k} className="flex items-center gap-2">
                    <kbd className="text-[9px] font-mono font-bold bg-gray-100 px-1.5 py-0.5 rounded border border-border whitespace-nowrap">{s.k}</kbd>
                    <span className="text-muted">{s.a}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── RIGHT: Canvas (3/5) ── */}
          <div className="lg:col-span-3 space-y-3">
            {mode === "single" ? (
              <>
                <div className="bg-gray-100 border border-border rounded-2xl p-3 flex items-center justify-center min-h-[400px]">
                  <canvas ref={canvasElRef} />
                </div>
                {imageDims && (
                  <p className="text-[11px] text-muted text-center">
                    {imageDims.w} x {imageDims.h}px - {outputFormat.toUpperCase()}
                  </p>
                )}
                <button
                  onClick={downloadSingle}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary text-white text-base font-bold rounded-2xl hover:bg-primary-hover transition-colors shadow-lg"
                >
                  <Download size={18} />
                  Download Image
                </button>
              </>
            ) : (
              <div className="bg-card border border-border rounded-2xl p-6 text-center">
                <ImagePlus size={48} className="text-muted mx-auto mb-3" />
                <p className="font-bold text-foreground mb-1">Batch mode</p>
                <p className="text-sm text-muted mb-4">
                  The text settings on the left will be applied to all {batchFiles.length} images.
                  Preview a single image in "Single Image" mode first if you want to see the exact result.
                </p>
                {batchProgress && (
                  <div className="mb-4">
                    <p className="text-xs text-muted mb-1">
                      Processing... ({batchProgress.done}/{batchProgress.total})
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${(batchProgress.done / batchProgress.total) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
                <button
                  onClick={downloadBatch}
                  disabled={!!batchProgress}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary text-white text-base font-bold rounded-2xl hover:bg-primary-hover transition-colors shadow-lg disabled:opacity-60"
                >
                  {batchProgress ? <Loader2 size={18} className="animate-spin" /> : <Package size={18} />}
                  {batchProgress ? "Processing..." : "Download All as ZIP"}
                </button>
              </div>
            )}

            <button
              onClick={reset}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-muted border border-border rounded-xl hover:border-primary/40 transition-colors"
            >
              Start Over
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ──────── Fabric Text Helpers ──────── */

function hexWithAlpha(hex: string, alpha: number): string {
  // Convert #RRGGBB + alpha (0-100) to rgba()
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha / 100})`;
}

function createFabricText(fabric: Fabric, layer: TextLayer, displayW: number, displayH: number): Fabric {
  const tb = new fabric.Textbox(layer.text || " ", {
    left: layer.left * displayW,
    top: layer.top * displayH,
    originX: "center",
    originY: "center",
  });
  applyLayerToFabricText(fabric, tb, layer, displayW, displayH);
  return tb;
}

function applyLayerToFabricText(fabric: Fabric, tb: Fabric, layer: TextLayer, displayW: number, displayH: number) {
  const bgFill =
    layer.bgMode === "none"
      ? undefined
      : layer.bgMode === "solid"
      ? layer.bgColor
      : hexWithAlpha(layer.bgColor, 50);

  const shadow = layer.shadowEnabled
    ? new fabric.Shadow({
        color: hexWithAlpha(layer.shadowColor, layer.shadowOpacity),
        blur: layer.shadowBlur,
        offsetX: layer.shadowX,
        offsetY: layer.shadowY,
      })
    : undefined;

  tb.set({
    text: layer.text || " ",
    fontFamily: layer.fontFamily,
    fontSize: layer.fontSize,
    fontWeight: layer.bold ? "bold" : "normal",
    fontStyle: layer.italic ? "italic" : "normal",
    underline: layer.underline,
    textAlign: layer.align,
    fill: layer.color,
    opacity: layer.opacity / 100,
    backgroundColor: bgFill || "",
    padding: layer.bgMode === "none" ? 0 : layer.bgPadding,
    stroke: layer.strokeEnabled ? layer.strokeColor : undefined,
    strokeWidth: layer.strokeEnabled ? layer.strokeWidth : 0,
    paintFirst: "stroke",
    shadow: shadow,
    charSpacing: layer.letterSpacing * 20, // fabric uses 1/1000 em units
    lineHeight: layer.lineHeight,
    left: layer.left * displayW,
    top: layer.top * displayH,
    angle: layer.rotation,
    originX: "center",
    originY: "center",
  });
  tb.setCoords();
}
