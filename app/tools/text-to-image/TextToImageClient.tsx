"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles, Loader2, Download, Wand2, Type as TypeIcon, ChevronDown, AlertCircle,
  Square, RectangleHorizontal, RectangleVertical,
} from "lucide-react";

/* ──────── Constants ──────── */

const EXAMPLE_PROMPTS = [
  "A calm Japanese zen garden at sunrise",
  "A neon-lit city street in the rain at night",
  "A minimalist desk setup with a plant and warm lamp light",
  "A mountain lake reflection at golden hour",
  "A cozy coffee shop interior, film photography style",
  "A white cat sitting on a windowsill in winter",
];

type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:2";

const ASPECT_RATIOS: { value: AspectRatio; label: string; desc: string; icon: typeof Square }[] = [
  { value: "1:1",  label: "1:1 Square",    desc: "Instagram, profile",    icon: Square },
  { value: "16:9", label: "16:9 Landscape", desc: "YouTube, slides",      icon: RectangleHorizontal },
  { value: "9:16", label: "9:16 Portrait",  desc: "Stories, TikTok",      icon: RectangleVertical },
  { value: "4:3",  label: "4:3 Standard",   desc: "Classic photo",        icon: RectangleHorizontal },
  { value: "3:2",  label: "3:2 Photo",      desc: "DSLR photo",           icon: RectangleHorizontal },
];

type Style =
  | "none"
  | "photorealistic"
  | "digital_art"
  | "watercolor"
  | "oil_painting"
  | "pencil_sketch"
  | "cinematic"
  | "anime"
  | "minimalist";

const STYLES: { value: Style; label: string; suffix: string }[] = [
  { value: "none",           label: "None (default)",   suffix: "" },
  { value: "photorealistic", label: "Photorealistic",    suffix: ", photorealistic, ultra detailed, natural lighting" },
  { value: "digital_art",    label: "Digital Art",       suffix: ", digital art, detailed illustration, vibrant colors" },
  { value: "watercolor",     label: "Watercolor",        suffix: ", watercolor painting style, artistic, detailed brushstrokes" },
  { value: "oil_painting",   label: "Oil Painting",      suffix: ", oil painting, classical art style, rich textures" },
  { value: "pencil_sketch",  label: "Pencil Sketch",     suffix: ", pencil sketch, hand drawn, fine line work, black and white" },
  { value: "cinematic",      label: "Cinematic",         suffix: ", cinematic lighting, film grain, dramatic mood, anamorphic" },
  { value: "anime",          label: "Anime",             suffix: ", anime style, studio ghibli inspired, vibrant cel shading" },
  { value: "minimalist",     label: "Minimalist",        suffix: ", minimalist composition, clean lines, simple color palette" },
];

const STATUS_MESSAGES = [
  "Starting AI model...",
  "Interpreting your prompt...",
  "Rendering image...",
  "Almost ready...",
];

const LOCAL_KEY = "lc_recent_generations";
const MAX_RECENT = 4;

interface RecentGen {
  id: string;
  prompt: string;
  imageUrl: string;
  timestamp: number;
  aspectRatio: AspectRatio;
}

/* ──────── Component ──────── */

export default function TextToImageClient() {
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("1:1");
  const [style, setStyle] = useState<Style>("none");
  const [loading, setLoading] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultPrompt, setResultPrompt] = useState<string | null>(null);
  const [resultRatio, setResultRatio] = useState<AspectRatio>("1:1");
  const [error, setError] = useState<string | null>(null);
  const [statusIdx, setStatusIdx] = useState(0);
  const [tipsOpen, setTipsOpen] = useState(false);
  const [recent, setRecent] = useState<RecentGen[]>([]);

  /* Load recent from localStorage */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      if (raw) setRecent(JSON.parse(raw));
    } catch {}
  }, []);

  /* Cycle status messages while loading */
  useEffect(() => {
    if (!loading) {
      setStatusIdx(0);
      return;
    }
    const interval = setInterval(() => {
      setStatusIdx((i) => (i + 1) % STATUS_MESSAGES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [loading]);

  /* Progress bar animation */
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (!loading) {
      setProgress(0);
      return;
    }
    const start = Date.now();
    const tick = () => {
      const elapsed = (Date.now() - start) / 1000;
      // Asymptote at 95% until actual completion
      const pct = Math.min(95, elapsed * 12);
      setProgress(pct);
    };
    const id = setInterval(tick, 100);
    return () => clearInterval(id);
  }, [loading]);

  const saveRecent = (entry: RecentGen) => {
    const updated = [entry, ...recent.filter((r) => r.id !== entry.id)].slice(0, MAX_RECENT);
    setRecent(updated);
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(updated));
    } catch {}
  };

  const generate = async () => {
    const trimmed = prompt.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setError(null);
    setResultUrl(null);

    const styleObj = STYLES.find((s) => s.value === style);
    const fullPrompt = trimmed + (styleObj?.suffix || "");

    try {
      const res = await fetch("/api/text-to-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: fullPrompt, aspectRatio }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      if (!data.imageUrl) {
        setError("No image was returned. Please try again.");
        setLoading(false);
        return;
      }

      setProgress(100);
      setTimeout(() => {
        setResultUrl(data.imageUrl);
        setResultPrompt(trimmed);
        setResultRatio(aspectRatio);
        setLoading(false);

        saveRecent({
          id: crypto.randomUUID(),
          prompt: trimmed,
          imageUrl: data.imageUrl,
          timestamp: Date.now(),
          aspectRatio,
        });
      }, 150);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const generateAnother = () => {
    setResultUrl(null);
    setError(null);
    setTimeout(() => generate(), 50);
  };

  const downloadWebp = async () => {
    if (!resultUrl) return;
    try {
      const res = await fetch(resultUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `loveconverts-${Date.now()}.webp`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setError("Could not download image. Try again.");
    }
  };

  const downloadPng = async () => {
    if (!resultUrl) return;
    try {
      // Draw the image into a canvas and export as PNG
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("load failed"));
        img.src = resultUrl;
      });
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("no ctx");
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(
        (blob) => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `loveconverts-${Date.now()}.png`;
          a.click();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        },
        "image/png"
      );
    } catch {
      setError("PNG conversion failed. Try WebP download instead.");
    }
  };

  const remaining = 500 - prompt.length;

  return (
    <div className="max-w-3xl mx-auto px-4 pb-4">
      {/* Prompt textarea */}
      <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value.slice(0, 500))}
          placeholder={"Describe the image you want to create...\nExample: a golden retriever puppy playing in autumn leaves, soft natural light, photorealistic"}
          rows={5}
          className="w-full bg-transparent text-sm text-foreground placeholder:text-muted/60 resize-none outline-none leading-relaxed"
          style={{ minHeight: "120px" }}
        />
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <p className="text-[11px] text-muted">Be specific for the best results</p>
          <p className={`text-[11px] font-semibold tabular-nums ${remaining < 50 ? "text-amber-600" : "text-muted"}`}>
            {prompt.length} / 500
          </p>
        </div>
      </div>

      {/* Example prompts */}
      <div className="mt-3">
        <p className="text-[11px] font-bold text-muted uppercase tracking-wider mb-2">Try an example</p>
        <div className="flex flex-wrap gap-1.5">
          {EXAMPLE_PROMPTS.map((ex) => (
            <button
              key={ex}
              onClick={() => setPrompt(ex)}
              className="px-3 py-1.5 text-xs text-foreground bg-card border border-border rounded-full hover:border-primary/40 hover:bg-primary-light/30 transition-colors"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      {/* Settings row */}
      <div className="grid sm:grid-cols-2 gap-3 mt-4">
        {/* Aspect Ratio */}
        <div className="bg-card border border-border rounded-xl p-3">
          <label className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-2">
            Aspect Ratio
          </label>
          <div className="grid grid-cols-5 gap-1.5">
            {ASPECT_RATIOS.map((r) => {
              const active = aspectRatio === r.value;
              const Icon = r.icon;
              return (
                <button
                  key={r.value}
                  onClick={() => setAspectRatio(r.value)}
                  title={`${r.label} - ${r.desc}`}
                  className={`flex flex-col items-center gap-1 py-2 px-1 rounded-lg border transition-colors ${
                    active
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border text-muted hover:border-primary/30 hover:text-foreground"
                  }`}
                >
                  <Icon size={14} />
                  <span className="text-[10px] font-bold">{r.value}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Style */}
        <div className="bg-card border border-border rounded-xl p-3">
          <label className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-2">
            Style Modifier
          </label>
          <select
            value={style}
            onChange={(e) => setStyle(e.target.value as Style)}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            {STYLES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Generate button */}
      <button
        onClick={generate}
        disabled={loading || !prompt.trim()}
        className="w-full mt-4 flex items-center justify-center gap-2 px-6 py-4 bg-primary text-white text-base font-bold rounded-2xl hover:bg-primary-hover transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
        {loading ? "Generating..." : "Generate Image"}
      </button>

      {/* Loading state */}
      {loading && (
        <div className="mt-4 bg-card border border-border rounded-xl p-4">
          <p className="text-sm text-foreground font-semibold text-center mb-2">
            {STATUS_MESSAGES[statusIdx]}
          </p>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-orange-500 rounded-full transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="mt-4 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertCircle size={16} className="flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Result */}
      {resultUrl && !loading && (
        <div className="mt-6 space-y-4">
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={resultUrl}
              alt={resultPrompt || "Generated image"}
              className="w-full h-auto block"
            />
          </div>
          <p className="text-[11px] text-muted text-center">
            Generated at {resultRatio} - WebP format
          </p>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={downloadWebp}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary-hover transition-colors"
            >
              <Download size={16} /> Download WebP
            </button>
            <button
              onClick={downloadPng}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-card border border-border text-foreground text-sm font-bold rounded-xl hover:border-primary/40 transition-colors"
            >
              <Download size={16} /> Download PNG
            </button>
          </div>

          <button
            onClick={generateAnother}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-muted border border-border rounded-xl hover:border-primary/40 hover:text-foreground transition-colors"
          >
            <Sparkles size={15} /> Generate Another
          </button>

          <div className="flex flex-col sm:flex-row gap-2 text-center">
            <Link
              href="/tools/ai-edit"
              className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-primary hover:underline py-2"
            >
              <Wand2 size={12} /> Edit this image further with AI
            </Link>
            <Link
              href="/tools/add-text"
              className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-primary hover:underline py-2"
            >
              <TypeIcon size={12} /> Add text to this image
            </Link>
          </div>
        </div>
      )}

      {/* Recent generations */}
      {recent.length > 0 && (
        <div className="mt-6">
          <p className="text-[11px] font-bold text-muted uppercase tracking-wider mb-2">
            Recent Generations
          </p>
          <div className="grid grid-cols-4 gap-2">
            {recent.map((r) => (
              <button
                key={r.id}
                onClick={() => {
                  setResultUrl(r.imageUrl);
                  setResultPrompt(r.prompt);
                  setResultRatio(r.aspectRatio);
                  setPrompt(r.prompt);
                }}
                className="aspect-square bg-gray-100 rounded-lg overflow-hidden border border-border hover:border-primary/40 transition-colors"
                title={r.prompt}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={r.imageUrl} alt={r.prompt} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
          <p className="text-[10px] text-muted/60 mt-2">Stored in your browser only</p>
        </div>
      )}

      {/* Tips (collapsible) */}
      <div className="mt-6">
        <button
          onClick={() => setTipsOpen((o) => !o)}
          className="flex items-center gap-2 text-xs font-semibold text-muted hover:text-foreground transition-colors"
        >
          <ChevronDown
            size={12}
            className={`transition-transform ${tipsOpen ? "rotate-180" : ""}`}
          />
          Tips for better results
        </button>
        {tipsOpen && (
          <div className="mt-2 bg-card border border-border rounded-xl p-4 space-y-2 text-xs text-muted">
            <p>
              <strong className="text-foreground">Be specific about lighting:</strong>{" "}
              &quot;golden hour light&quot;, &quot;soft studio lighting&quot;, &quot;dramatic shadows&quot;
            </p>
            <p>
              <strong className="text-foreground">Mention style:</strong>{" "}
              &quot;photorealistic&quot;, &quot;watercolor&quot;, &quot;35mm film photography&quot;
            </p>
            <p>
              <strong className="text-foreground">Describe the mood:</strong>{" "}
              &quot;calm&quot;, &quot;dramatic&quot;, &quot;playful&quot;, &quot;minimalist&quot;
            </p>
            <p>
              <strong className="text-foreground">Add camera details for photos:</strong>{" "}
              &quot;shot on Canon 5D&quot;, &quot;85mm lens&quot;, &quot;shallow depth of field&quot;
            </p>
            <p>
              <strong className="text-foreground">Mention composition:</strong>{" "}
              &quot;wide angle&quot;, &quot;close-up portrait&quot;, &quot;aerial view&quot;
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
