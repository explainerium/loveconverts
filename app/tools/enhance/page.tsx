"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useDropzone } from "react-dropzone";
import Link from "next/link";
import {
  Sparkles, Upload, Download, Loader2, RefreshCw, Wand2, Sun,
  Droplets, Palette, Mountain, UserCircle, Moon, Zap, Eye,
  SlidersHorizontal, ChevronDown, Minimize2, Maximize2, Crop,
  Pencil, Star, Heart, Flame, Cloud, Aperture, Ghost,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

type EnhanceMode =
  | "auto" | "upscale" | "portrait" | "denoise" | "sharpen"
  | "hdr" | "color" | "lowlight"
  | "cartoon" | "sketch" | "glow" | "vintage" | "popart" | "dreamy" | "neon" | "superhero"
  | "custom";

interface Params {
  mode: EnhanceMode;
  scale: number;
  denoise: number;
  sharpen: number;
  clarity: number;
  vibrance: number;
  brightness: number;
  contrast: number;
  highlights: number;
  shadows: number;
  warmth: number;
  blur: number;
  vignette: number;
  quality: number;
  outputFormat: string;
}

const DEFAULT: Params = {
  mode: "auto", scale: 1, denoise: 0, sharpen: 0, clarity: 0,
  vibrance: 0, brightness: 0, contrast: 0, highlights: 0,
  shadows: 0, warmth: 0, blur: 0, vignette: 0, quality: 92, outputFormat: "jpg",
};

// ── Mode definitions ─────────────────────────────────────────────────────────

interface ModeInfo {
  key: EnhanceMode;
  emoji: string;
  label: string;
  desc: string;
  bg: string;
  border: string;
  iconBg: string;
  icon: typeof Sparkles;
  category: "enhance" | "creative";
}

const MODES: ModeInfo[] = [
  // Enhance category
  { key: "auto",     emoji: "\u2728", label: "Magic Fix",       desc: "One click wonder!",           bg: "bg-violet-50",  border: "border-violet-300", iconBg: "from-violet-500 to-purple-500",  icon: Sparkles,          category: "enhance" },
  { key: "upscale",  emoji: "\uD83D\uDD0D", label: "Super Zoom",      desc: "Make it 2x or 4x bigger",     bg: "bg-blue-50",    border: "border-blue-300",   iconBg: "from-blue-500 to-cyan-500",     icon: Maximize2,         category: "enhance" },
  { key: "portrait", emoji: "\uD83E\uDD33", label: "Selfie Glow",     desc: "Look amazing in selfies",     bg: "bg-pink-50",    border: "border-pink-300",   iconBg: "from-pink-500 to-rose-500",     icon: UserCircle,        category: "enhance" },
  { key: "denoise",  emoji: "\uD83E\uDDF9", label: "Clean Up",        desc: "Remove blur and grain",       bg: "bg-teal-50",    border: "border-teal-300",   iconBg: "from-teal-500 to-emerald-500",  icon: Droplets,          category: "enhance" },
  { key: "sharpen",  emoji: "\u26A1",       label: "Ultra Sharp",     desc: "Super crispy details",        bg: "bg-amber-50",   border: "border-amber-300",  iconBg: "from-amber-500 to-orange-500",  icon: Zap,               category: "enhance" },
  { key: "hdr",      emoji: "\uD83C\uDF04", label: "Epic HDR",        desc: "Dramatic and bold",           bg: "bg-orange-50",  border: "border-orange-300", iconBg: "from-orange-500 to-red-500",    icon: Mountain,          category: "enhance" },
  { key: "color",    emoji: "\uD83C\uDF08", label: "Color Boost",     desc: "Make colors pop!",            bg: "bg-green-50",   border: "border-green-300",  iconBg: "from-green-500 to-emerald-500", icon: Palette,           category: "enhance" },
  { key: "lowlight", emoji: "\uD83C\uDF19", label: "Night Vision",    desc: "Fix dark photos",             bg: "bg-indigo-50",  border: "border-indigo-300", iconBg: "from-indigo-500 to-blue-600",   icon: Moon,              category: "enhance" },
  // Creative category
  { key: "cartoon",  emoji: "\uD83D\uDC7E", label: "Cartoon",         desc: "Look like a cartoon!",        bg: "bg-yellow-50",  border: "border-yellow-300", iconBg: "from-yellow-500 to-amber-500",  icon: Ghost,             category: "creative" },
  { key: "sketch",   emoji: "\u270F\uFE0F", label: "Pencil Sketch",   desc: "Cool drawing effect",         bg: "bg-gray-50",    border: "border-gray-300",   iconBg: "from-gray-500 to-gray-700",     icon: Pencil,            category: "creative" },
  { key: "glow",     emoji: "\uD83D\uDCA1", label: "Dreamy Glow",     desc: "Soft magical glow",           bg: "bg-sky-50",     border: "border-sky-300",    iconBg: "from-sky-400 to-blue-500",      icon: Sun,               category: "creative" },
  { key: "vintage",  emoji: "\uD83D\uDCF7", label: "Retro Vibes",     desc: "Old-school cool",             bg: "bg-amber-50",   border: "border-amber-300",  iconBg: "from-amber-600 to-yellow-700",  icon: Aperture,          category: "creative" },
  { key: "popart",   emoji: "\uD83C\uDFA8", label: "Pop Art",         desc: "Bright & bold colors",        bg: "bg-fuchsia-50", border: "border-fuchsia-300",iconBg: "from-fuchsia-500 to-pink-500",  icon: Star,              category: "creative" },
  { key: "neon",     emoji: "\uD83D\uDD25", label: "Neon Lights",     desc: "Electric neon colors",        bg: "bg-cyan-50",    border: "border-cyan-300",   iconBg: "from-cyan-500 to-violet-500",   icon: Flame,             category: "creative" },
  { key: "superhero",emoji: "\uD83E\uDDB8", label: "Superhero",       desc: "Look like a hero!",           bg: "bg-red-50",     border: "border-red-300",    iconBg: "from-red-500 to-orange-500",    icon: Heart,             category: "creative" },
  { key: "dreamy",   emoji: "\u2601\uFE0F", label: "Cloud Nine",      desc: "Soft & dreamy mood",          bg: "bg-purple-50",  border: "border-purple-300", iconBg: "from-purple-400 to-pink-400",   icon: Cloud,             category: "creative" },
  // Custom
  { key: "custom",   emoji: "\uD83D\uDEE0\uFE0F", label: "Custom Mix",      desc: "You control everything",      bg: "bg-slate-50",   border: "border-slate-300",  iconBg: "from-slate-500 to-slate-700",   icon: SlidersHorizontal, category: "creative" },
];

type SliderDef = { key: keyof Params; label: string; emoji: string; min: number; max: number; step: number };

const DETAIL_SLIDERS: SliderDef[] = [
  { key: "denoise",  label: "Clean Up",   emoji: "\uD83E\uDDF9", min: 0,   max: 100, step: 1 },
  { key: "sharpen",  label: "Sharpen",    emoji: "\u26A1",       min: 0,   max: 100, step: 1 },
  { key: "clarity",  label: "Clarity",    emoji: "\uD83D\uDD2C", min: 0,   max: 100, step: 1 },
  { key: "blur",     label: "Soft Blur",  emoji: "\uD83D\uDCA8", min: 0,   max: 30,  step: 0.5 },
];

const COLOR_SLIDERS: SliderDef[] = [
  { key: "brightness", label: "Brightness",  emoji: "\u2600\uFE0F", min: -50, max: 50,  step: 1 },
  { key: "contrast",   label: "Contrast",    emoji: "\uD83C\uDF17", min: -50, max: 50,  step: 1 },
  { key: "vibrance",   label: "Vibrance",    emoji: "\uD83C\uDF08", min: 0,   max: 100, step: 1 },
  { key: "warmth",     label: "Warmth",      emoji: "\uD83D\uDD25", min: -50, max: 50,  step: 1 },
];

const TONE_SLIDERS: SliderDef[] = [
  { key: "shadows",    label: "Shadows",    emoji: "\uD83C\uDF11", min: -50, max: 50,  step: 1 },
  { key: "highlights", label: "Highlights", emoji: "\uD83C\uDF1F", min: -50, max: 50,  step: 1 },
  { key: "vignette",   label: "Vignette",   emoji: "\u2B55",       min: 0,   max: 100, step: 1 },
];

function fmtBytes(n: number) {
  if (n < 1024) return n + " B";
  if (n < 1048576) return (n / 1024).toFixed(1) + " KB";
  return (n / 1048576).toFixed(2) + " MB";
}

// ── Component ────────────────────────────────────────────────────────────────

export default function EnhancePage() {
  const [file,         setFile]         = useState<File | null>(null);
  const [imgSrc,       setImgSrc]       = useState("");
  const [params,       setParams]       = useState<Params>(DEFAULT);
  const [previewUrl,   setPreviewUrl]   = useState("");
  const [previewLoading, setPLoading]   = useState(false);
  const [processing,   setProcessing]   = useState(false);
  const [resultUrl,    setResultUrl]    = useState("");
  const [resultName,   setResultName]   = useState("");
  const [resultSize,   setResultSize]   = useState(0);
  const [error,        setError]        = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [compareMode,  setCompareMode]  = useState(false);
  const [comparePos,   setComparePos]   = useState(50);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevUrlRef  = useRef("");
  const compareRef  = useRef<HTMLDivElement>(null);

  const set = <K extends keyof Params>(key: K, val: Params[K]) =>
    setParams((p) => ({ ...p, [key]: val }));

  const applyMode = (mode: EnhanceMode) => {
    if (mode === "custom") {
      setParams((p) => ({ ...p, mode: "custom" }));
      setShowAdvanced(true);
    } else {
      setParams({ ...DEFAULT, mode, scale: mode === "upscale" ? 2 : 1 });
      setShowAdvanced(false);
    }
  };

  const buildFormData = useCallback((f: File, preview: boolean, p: Params) => {
    const fd = new FormData();
    fd.append("file", f);
    fd.append("preview", preview ? "true" : "false");
    Object.entries(p).forEach(([k, v]) => fd.append(k, String(v)));
    return fd;
  }, []);

  // Debounced preview
  useEffect(() => {
    if (!file) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setPLoading(true);
      try {
        const res = await fetch("/api/tools/enhance", {
          method: "POST",
          body: buildFormData(file, true, params),
        });
        if (!res.ok) return;
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current);
        prevUrlRef.current = url;
        setPreviewUrl(url);
      } catch { /* silent */ } finally { setPLoading(false); }
    }, 500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [file, params, buildFormData]);

  const onDrop = useCallback((files: File[]) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setResultUrl(""); setResultSize(0);
    setParams({ ...DEFAULT, mode: "auto" });
    const reader = new FileReader();
    reader.onload = () => setImgSrc(reader.result as string);
    reader.readAsDataURL(f);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { "image/*": [] }, maxFiles: 1,
  });

  const handleSave = async () => {
    if (!file) return;
    setProcessing(true); setError("");
    try {
      const res = await fetch("/api/tools/enhance", {
        method: "POST",
        body: buildFormData(file, false, params),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Enhancement failed"); return;
      }
      const blob = await res.blob();
      const name = `${file.name.replace(/\.[^.]+$/, "")}-enhanced.${params.outputFormat}`;
      setResultUrl(URL.createObjectURL(blob));
      setResultName(name); setResultSize(blob.size);
    } catch { setError("Something went wrong! Try again."); }
    finally { setProcessing(false); }
  };

  const handleCompareMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!compareRef.current) return;
    const rect = compareRef.current.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    setComparePos(Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100)));
  }, []);

  const enhanceModes = MODES.filter(m => m.category === "enhance");
  const creativeModes = MODES.filter(m => m.category === "creative");

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50/50 to-background">
      {/* Hero */}
      <section className="relative overflow-hidden py-10 sm:py-14">
        <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full opacity-20 blur-3xl bg-violet-400" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 rounded-full opacity-15 blur-3xl bg-pink-400" />
        <div className="absolute top-10 left-1/3 w-32 h-32 rounded-full opacity-10 blur-3xl bg-cyan-400" />

        <div className="relative max-w-5xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-100 to-pink-100 text-violet-700 text-sm font-bold px-5 py-2 rounded-full border border-violet-200 mb-5">
            <Sparkles size={16} /> AI Photo Enhancer for Kids
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-foreground leading-tight">
            Make Your Photos{" "}
            <span style={{
              background: "linear-gradient(135deg, #8B5CF6, #EC4899, #F59E0B)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            }}>
              AWESOME!
            </span>
          </h1>
          <p className="text-muted mt-3 max-w-lg mx-auto">
            Choose a magic style, see the preview, and download your enhanced photo. All features are <strong className="text-green-600">100% free</strong> — no limits!
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 pb-16 space-y-6">
        {/* ── Upload ─────────────────────────────────────────────────────── */}
        {!file && (
          <div {...getRootProps()} className={`border-3 border-dashed rounded-3xl p-16 text-center cursor-pointer transition-all ${
            isDragActive
              ? "border-violet-400 bg-violet-50 scale-[1.01]"
              : "border-violet-200 hover:border-violet-400 hover:bg-violet-50/50"
          }`}>
            <input {...getInputProps()} />
            <div className="text-5xl mb-3">{isDragActive ? "\uD83C\uDF89" : "\uD83D\uDDBC\uFE0F"}</div>
            <p className="font-bold text-xl text-foreground">
              {isDragActive ? "Drop it right here!" : "Drop your photo here or click to pick one!"}
            </p>
            <p className="text-sm text-muted mt-2">JPG, PNG, WEBP — up to 50 MB — totally free!</p>
          </div>
        )}

        {file && (
          <>
            {/* ── Enhancement Modes ──────────────────────────────────────── */}
            <div>
              <h2 className="text-sm font-bold text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                <Sparkles size={14} className="text-violet-500" /> Enhancement Modes
              </h2>
              <div className="grid grid-cols-4 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                {enhanceModes.map(({ key, emoji, label, desc, bg, border, iconBg, icon: Icon }) => (
                  <button key={key} onClick={() => applyMode(key)}
                    className={`relative p-2.5 rounded-2xl border-2 text-center transition-all duration-200 group hover:scale-[1.03] active:scale-[0.97] ${
                      params.mode === key ? `${bg} ${border} shadow-lg ring-2 ring-violet-300` : `bg-white border-border hover:${bg} hover:shadow-md`
                    }`}>
                    <div className={`w-10 h-10 mx-auto rounded-xl flex items-center justify-center mb-1.5 transition-all ${
                      params.mode === key ? `bg-gradient-to-br ${iconBg} text-white shadow-md` : "bg-gray-100 text-gray-400 group-hover:bg-gray-200"
                    }`}>
                      <span className="text-lg">{emoji}</span>
                    </div>
                    <p className={`text-[11px] font-bold leading-tight ${params.mode === key ? "text-foreground" : "text-muted"}`}>{label}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Creative Filters */}
            <div>
              <h2 className="text-sm font-bold text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                <Palette size={14} className="text-pink-500" /> Creative Filters
              </h2>
              <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
                {creativeModes.map(({ key, emoji, label, bg, border, iconBg }) => (
                  <button key={key} onClick={() => applyMode(key)}
                    className={`relative p-2.5 rounded-2xl border-2 text-center transition-all duration-200 group hover:scale-[1.03] active:scale-[0.97] ${
                      params.mode === key ? `${bg} ${border} shadow-lg ring-2 ring-pink-300` : `bg-white border-border hover:${bg} hover:shadow-md`
                    }`}>
                    <div className={`w-9 h-9 mx-auto rounded-xl flex items-center justify-center mb-1 transition-all ${
                      params.mode === key ? `bg-gradient-to-br ${iconBg} text-white shadow-md` : "bg-gray-100 text-gray-400"
                    }`}>
                      <span className="text-base">{emoji}</span>
                    </div>
                    <p className={`text-[10px] font-bold leading-tight ${params.mode === key ? "text-foreground" : "text-muted"}`}>{label}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Upscale selector */}
            {params.mode === "upscale" && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4">
                <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-3">{"\uD83D\uDD0D"} How Big?</p>
                <div className="flex gap-3">
                  {[2, 4].map((s) => (
                    <button key={s} onClick={() => set("scale", s)}
                      className={`flex-1 py-4 rounded-2xl border-2 text-center font-extrabold transition-all hover:scale-[1.02] ${
                        params.scale === s
                          ? "border-blue-400 bg-white text-blue-700 shadow-lg"
                          : "border-blue-200 text-blue-400 hover:border-blue-300"
                      }`}>
                      <span className="text-3xl">{s}x</span>
                      <p className="text-[11px] text-blue-500 mt-1 font-medium">{s === 2 ? "Double size" : "Quadruple size!"}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Editor layout ───────────────────────────────────────────── */}
            <div className="grid lg:grid-cols-[1fr_320px] gap-5">
              {/* Preview */}
              <div className="bg-white border-2 border-border rounded-2xl p-3 min-h-[400px] flex flex-col shadow-sm">
                <div className="flex items-center justify-between mb-2 px-1">
                  <div className="flex items-center gap-2">
                    {previewLoading && <Loader2 size={14} className="animate-spin text-violet-500" />}
                    <span className="text-[11px] text-muted font-medium">
                      {previewLoading ? "\u2728 Making it awesome..." : `\u2728 ${MODES.find(m => m.key === params.mode)?.label || "Preview"}`}
                    </span>
                  </div>
                  <button onClick={() => setCompareMode(!compareMode)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                      compareMode ? "bg-violet-100 text-violet-700 shadow-sm" : "text-muted hover:bg-gray-100"
                    }`}>
                    <Eye size={12} /> Before / After
                  </button>
                </div>

                <div className="flex-1 flex items-center justify-center relative overflow-hidden rounded-xl bg-[repeating-conic-gradient(#f1f5f9_0%_25%,transparent_0%_50%)_0_0/16px_16px]">
                  {compareMode && previewUrl ? (
                    <div ref={compareRef} className="relative w-full h-full cursor-col-resize select-none"
                      onMouseMove={handleCompareMove} onTouchMove={handleCompareMove}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={previewUrl} alt="Enhanced" className="w-full h-full object-contain" />
                      <div className="absolute inset-0 overflow-hidden" style={{ width: `${comparePos}%` }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={imgSrc} alt="Original" className="w-full h-full object-contain" style={{ minWidth: compareRef.current?.offsetWidth }} />
                      </div>
                      <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg" style={{ left: `${comparePos}%` }}>
                        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-white shadow-xl border-2 border-violet-400 flex items-center justify-center text-base">
                          {"\u2194\uFE0F"}
                        </div>
                      </div>
                      <span className="absolute top-3 left-3 text-[10px] font-bold bg-black/50 text-white px-2 py-0.5 rounded-full">Before</span>
                      <span className="absolute top-3 right-3 text-[10px] font-bold bg-violet-500/80 text-white px-2 py-0.5 rounded-full">After {"\u2728"}</span>
                    </div>
                  ) : (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={previewUrl || imgSrc} alt="Preview"
                      className="max-w-full max-h-[500px] object-contain transition-opacity rounded-lg"
                      style={{ opacity: previewLoading ? 0.5 : 1 }} />
                  )}
                </div>
              </div>

              {/* Controls */}
              <div className="space-y-4">
                {/* Active mode card */}
                {params.mode !== "custom" && (
                  <div className={`rounded-2xl p-4 border-2 ${MODES.find(m => m.key === params.mode)?.bg} ${MODES.find(m => m.key === params.mode)?.border}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{MODES.find(m => m.key === params.mode)?.emoji}</span>
                      <span className="text-sm font-bold text-foreground">{MODES.find(m => m.key === params.mode)?.label}</span>
                    </div>
                    <p className="text-[11px] text-muted">
                      {MODES.find(m => m.key === params.mode)?.desc} — Click &quot;Advanced&quot; to tweak!
                    </p>
                  </div>
                )}

                {/* Advanced toggle */}
                <button onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-white border-2 border-border rounded-2xl text-sm font-bold text-foreground hover:bg-gray-50 transition-colors">
                  <span className="flex items-center gap-2">
                    <SlidersHorizontal size={15} className="text-violet-500" />
                    Advanced Controls
                  </span>
                  <ChevronDown size={14} className={`text-muted transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
                </button>

                {showAdvanced && (
                  <div className="space-y-3">
                    {[
                      { title: "Detail & Noise", emoji: "\uD83D\uDD27", sliders: DETAIL_SLIDERS },
                      { title: "Color & Light", emoji: "\uD83C\uDF08", sliders: COLOR_SLIDERS },
                      { title: "Tone & Effects", emoji: "\uD83C\uDFA8", sliders: TONE_SLIDERS },
                    ].map(({ title, emoji, sliders }) => (
                      <div key={title} className="bg-white border-2 border-border rounded-2xl p-4 space-y-3">
                        <p className="text-[10px] font-bold text-muted uppercase tracking-wider">{emoji} {title}</p>
                        {sliders.map(({ key, label, emoji: sEmoji, min, max, step }) => (
                          <div key={key}>
                            <div className="flex justify-between mb-1">
                              <span className="text-xs font-semibold text-foreground">{sEmoji} {label}</span>
                              <span className="text-xs font-bold text-violet-600">{params[key] as number}</span>
                            </div>
                            <input type="range" min={min} max={max} step={step}
                              value={params[key] as number}
                              onChange={(e) => set(key, Number(e.target.value))}
                              className="custom-range w-full" />
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}

                {/* Output */}
                <div className="bg-white border-2 border-border rounded-2xl p-4 space-y-3">
                  <p className="text-[10px] font-bold text-muted uppercase tracking-wider">{"\uD83D\uDCBE"} Save As</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-muted block mb-1">Format</label>
                      <select value={params.outputFormat} onChange={(e) => set("outputFormat", e.target.value)}
                        className="w-full border-2 border-border rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-300 font-medium">
                        <option value="jpg">JPG</option>
                        <option value="png">PNG</option>
                        <option value="webp">WEBP</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted block mb-1">Quality</label>
                      <input type="number" min={1} max={100} value={params.quality}
                        onChange={(e) => set("quality", Number(e.target.value))}
                        className="w-full border-2 border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 font-medium" />
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="text-sm text-red-600 bg-red-50 border-2 border-red-200 rounded-xl px-3 py-2">
                    {"\u274C"} {error}
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-2">
                  <button onClick={handleSave} disabled={processing}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-extrabold text-white rounded-2xl transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.97] disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg, #8B5CF6, #EC4899, #F59E0B)" }}>
                    {processing ? <Loader2 size={16} className="animate-spin" /> : <>{"\u2728"}</>}
                    {processing ? "Enhancing..." : "Enhance & Download!"}
                  </button>
                  <button onClick={() => setParams({ ...DEFAULT, mode: params.mode })}
                    className="p-3.5 border-2 border-border rounded-2xl text-muted hover:text-foreground hover:border-foreground/30 transition-colors" title="Reset">
                    <RefreshCw size={16} />
                  </button>
                  <button onClick={() => { setFile(null); setImgSrc(""); setPreviewUrl(""); setResultUrl(""); }}
                    className="px-3 py-3.5 border-2 border-border rounded-2xl text-xs font-bold text-muted hover:text-foreground transition-colors">
                    New
                  </button>
                </div>

                {/* Result */}
                {resultUrl && (
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-2xl p-5 space-y-3 shadow-md">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{"\uD83C\uDF89"}</span>
                      <span className="text-sm font-extrabold text-green-700">Woohoo! It looks amazing!</span>
                    </div>
                    <p className="text-xs text-green-600">
                      {file && `${fmtBytes(file.size)} \u2192 ${fmtBytes(resultSize)}`}
                      {params.scale > 1 && ` \u00B7 ${params.scale}x bigger!`}
                    </p>
                    <a href={resultUrl} download={resultName}
                      className="flex items-center justify-center gap-2 w-full py-3 text-sm font-extrabold text-white rounded-xl transition-all hover:scale-[1.02] shadow-md"
                      style={{ background: "linear-gradient(135deg, #22C55E, #10B981)" }}>
                      <Download size={16} /> Download Your Photo!
                    </a>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* ── Features ───────────────────────────────────────────────────── */}
        <div className="pt-6">
          <h2 className="text-center text-2xl font-extrabold text-foreground mb-6">
            What Can You Do? <span className="text-violet-500">{"\u2728"}</span>
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { emoji: "\u2728", title: "Magic Fix",      desc: "One click and your photo looks amazing! The AI picks the best settings for you.", color: "border-violet-200 bg-violet-50" },
              { emoji: "\uD83D\uDD0D", title: "Super Zoom",     desc: "Make your photos 2x or 4x bigger without making them blurry. Like a magnifying glass!", color: "border-blue-200 bg-blue-50" },
              { emoji: "\uD83D\uDC7E", title: "Fun Filters",    desc: "Turn your photos into cartoons, sketches, neon art, pop art, and more cool styles!", color: "border-pink-200 bg-pink-50" },
              { emoji: "\uD83E\uDDB8", title: "Superhero Mode", desc: "Make any photo look dramatic and epic — like a movie poster!", color: "border-red-200 bg-red-50" },
            ].map(({ emoji, title, desc, color }) => (
              <div key={title} className={`border-2 rounded-2xl p-5 ${color}`}>
                <span className="text-3xl">{emoji}</span>
                <h3 className="font-bold text-foreground text-sm mt-2 mb-1">{title}</h3>
                <p className="text-xs text-muted leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── All Free badge ─────────────────────────────────────────────── */}
        <div className="text-center py-6">
          <div className="inline-flex items-center gap-2 bg-green-50 border-2 border-green-200 text-green-700 text-sm font-bold px-6 py-3 rounded-full">
            {"\uD83C\uDD93"} All Features Are 100% Free — No Limits, No Sign-Up!
          </div>
        </div>

        {/* Related Tools */}
        <div>
          <h3 className="text-sm font-bold text-muted uppercase tracking-wider mb-3">More Cool Tools</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { href: "/tools/photo-editor", icon: Wand2,     label: "Photo Editor" },
              { href: "/tools/compress",     icon: Minimize2, label: "Compress" },
              { href: "/tools/crop",         icon: Crop,      label: "Crop" },
            ].map(({ href, icon: Icon, label }) => (
              <Link key={href} href={href}
                className="flex flex-col items-center gap-2 p-3 rounded-2xl border-2 border-border hover:border-violet-300 hover:shadow-md transition-all text-center group">
                <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center group-hover:bg-violet-200 transition-colors">
                  <Icon size={18} className="text-violet-600" />
                </div>
                <span className="text-xs font-bold text-foreground group-hover:text-violet-600 transition-colors">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
