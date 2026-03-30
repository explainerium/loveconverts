"use client";

import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import UpgradeModal from "./UpgradeModal";
import { useDropzone } from "react-dropzone";
import JSZip from "jszip";
import {
  Upload,
  Download,
  X,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ImageIcon,
  Trash2,
  Package,
  Settings2,
  RotateCcw,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Link2,
  Link2Off,
  ArrowRight,
  Eye,
  History,
  Info,
  SlidersHorizontal,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type ImageStatus = "idle" | "converting" | "done" | "error";
type FitMode = "contain" | "cover" | "fill" | "inside" | "outside";
type RotateDeg = 0 | 90 | 180 | 270;

interface ConversionOptions {
  quality: number;
  width: string;
  height: string;
  stripMetadata: boolean;
  lockAspectRatio: boolean;
  grayscale: boolean;
  rotate: RotateDeg;
  flip: boolean;
  flop: boolean;
  fit: FitMode;
  withoutEnlargement: boolean;
}

interface ImageItem {
  id: string;
  file: File;
  previewUrl: string;
  status: ImageStatus;
  convertedBlob?: Blob;
  convertedSize?: number;
  convertedPreviewUrl?: string;
  originalSize: number;
  dimensions?: { width: number; height: number };
  errorMessage?: string;
}

interface HistoryEntry {
  id: string;
  filename: string;
  fromFormat: string;
  toFormat: string;
  originalSize: number;
  convertedSize: number;
  timestamp: number;
}

interface ToastItem {
  id: string;
  message: string;
  type: "error" | "success" | "info";
}

// ─── Constants ───────────────────────────────────────────────────────────────

const FORMATS = ["JPG", "PNG", "WEBP", "GIF", "TIFF", "AVIF", "ICO"] as const;
const FREE_MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB for free/anonymous
const PRO_MAX_FILE_SIZE  = 50 * 1024 * 1024; // 50 MB for pro
const QUALITY_FORMATS = new Set(["jpg", "jpeg", "webp", "avif"]);
const HISTORY_KEY = "convertimg-history";

const FORMAT_TIPS: Record<string, string> = {
  JPG:  "Best for photos. Small file size. No transparency support.",
  PNG:  "Lossless. Best for graphics & transparency. Larger files.",
  WEBP: "Best for web. ~30% smaller than JPG with same quality. Supports transparency.",
  GIF:  "Supports animation. Limited to 256 colors.",
  TIFF: "High quality lossless. Best for print. Very large files.",
  AVIF: "Next-gen format. Excellent compression. Limited browser support.",
  ICO:  "Windows icon format. Best for favicons and app icons.",
};

const DEFAULT_OPTIONS: ConversionOptions = {
  quality: 85,
  width: "",
  height: "",
  stripMetadata: true,
  lockAspectRatio: true,
  grayscale: false,
  rotate: 0,
  flip: false,
  flop: false,
  fit: "inside",
  withoutEnlargement: true,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 11);
}

function getImageDimensions(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve({ width: 0, height: 0 });
    img.src = src;
  });
}

function timeAgo(ts: number): string {
  const diff = (Date.now() - ts) / 1000;
  if (diff < 60)  return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ─── Toggle Switch ────────────────────────────────────────────────────────────

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer select-none">
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="toggle-track"
        type="button"
      >
        <span className="toggle-thumb" />
      </button>
      {label && <span className="text-sm text-foreground/80">{label}</span>}
    </label>
  );
}

// ─── Toast System ─────────────────────────────────────────────────────────────

function ToastContainer({ toasts, onDismiss }: { toasts: ToastItem[]; onDismiss: (id: string) => void }) {
  return (
    <div className="fixed bottom-6 right-4 z-[60] flex flex-col gap-2 max-w-sm w-full sm:w-auto pointer-events-none">
      {toasts.map((t) => (
        <ToastMessage key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastMessage({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 4500);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const colors = {
    error:   "bg-gray-900 text-white",
    success: "bg-green-800 text-white",
    info:    "bg-gray-900 text-white",
  };
  const icons = {
    error:   <AlertCircle size={15} className="text-red-400 flex-shrink-0" />,
    success: <CheckCircle2 size={15} className="text-green-300 flex-shrink-0" />,
    info:    <Info size={15} className="text-blue-400 flex-shrink-0" />,
  };

  return (
    <div className={`pointer-events-auto animate-fade-in-up flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-sm ${colors[toast.type]}`}>
      {icons[toast.type]}
      <span className="flex-1">{toast.message}</span>
      <button onClick={() => onDismiss(toast.id)} className="opacity-60 hover:opacity-100 transition-opacity ml-1">
        <X size={13} />
      </button>
    </div>
  );
}

function useToasts() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const add = useCallback((message: string, type: ToastItem["type"] = "error") => {
    const id = generateId();
    setToasts((p) => [...p, { id, message, type }]);
  }, []);
  const dismiss = useCallback((id: string) => {
    setToasts((p) => p.filter((t) => t.id !== id));
  }, []);
  return { toasts, add, dismiss };
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status, errorMessage }: { status: ImageStatus; errorMessage?: string }) {
  const map: Record<ImageStatus, { cls: string; label: string; icon?: React.ReactNode }> = {
    idle:       { cls: "bg-gray-100 text-gray-500",   label: "Pending" },
    converting: { cls: "bg-blue-100 text-blue-700",   label: "Converting…", icon: <Loader2 size={9} className="animate-spin" /> },
    done:       { cls: "bg-green-100 text-green-700", label: "Done ✓" },
    error:      { cls: "bg-red-100 text-red-600",     label: "Error" },
  };
  const { cls, label, icon } = map[status];
  return (
    <span title={errorMessage} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${cls}`}>
      {icon}
      {label}
    </span>
  );
}

// ─── Image Card ───────────────────────────────────────────────────────────────

function ImageCard({
  item,
  targetFormat,
  onRemove,
  onDownload,
  onRetry,
  onPreview,
}: {
  item: ImageItem;
  targetFormat: string;
  onRemove: (id: string) => void;
  onDownload: (item: ImageItem) => void;
  onRetry: (id: string) => void;
  onPreview: (item: ImageItem) => void;
}) {
  const savings =
    item.convertedSize !== undefined && item.convertedSize < item.originalSize
      ? Math.round(((item.originalSize - item.convertedSize) / item.originalSize) * 100)
      : 0;
  const origExt = item.file.name.split(".").pop()?.toUpperCase() ?? "IMG";

  return (
    <div className="animate-fade-in-up bg-card rounded-2xl border border-border shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* Thumbnail row */}
      <div className="flex items-stretch bg-gray-50 border-b border-border gap-0">
        {/* Original thumb */}
        <div className="w-[80px] h-[80px] flex-shrink-0 bg-[repeating-conic-gradient(#e5e7eb_0%_25%,transparent_0%_50%)_0_0/12px_12px] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.previewUrl} alt="" className="w-full h-full object-cover" />
        </div>

        {/* Arrow */}
        <div className="flex items-center px-2 text-muted">
          <ArrowRight size={14} />
        </div>

        {/* Converted thumb */}
        <div className="w-[80px] h-[80px] flex-shrink-0 bg-[repeating-conic-gradient(#e5e7eb_0%_25%,transparent_0%_50%)_0_0/12px_12px] overflow-hidden">
          {item.convertedPreviewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.convertedPreviewUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon size={20} className="text-gray-300" />
            </div>
          )}
        </div>

        {/* Badges */}
        <div className="flex flex-col justify-center px-3 gap-1.5 flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-200 text-gray-600">{origExt}</span>
            <ArrowRight size={10} className="text-gray-400" />
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary text-white">{targetFormat.toUpperCase()}</span>
          </div>
          <StatusBadge status={item.status} errorMessage={item.errorMessage} />
        </div>

        {/* Remove */}
        <button
          onClick={() => onRemove(item.id)}
          className="self-start mt-2 mr-2 p-1 rounded-full text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors"
          title="Remove"
        >
          <X size={13} />
        </button>
      </div>

      {/* Info */}
      <div className="px-3 py-2.5 space-y-1.5">
        <p className="text-[13px] font-medium text-foreground truncate" title={item.file.name}>
          {item.file.name}
        </p>

        <div className="flex items-center justify-between text-[11px] text-muted gap-2">
          <span>
            {formatBytes(item.originalSize)}
            {item.convertedSize !== undefined && (
              <>
                <span className="mx-1">→</span>
                <span className="font-semibold text-foreground/70">{formatBytes(item.convertedSize)}</span>
                {savings > 0 && (
                  <span className="ml-1 text-green-600 font-bold">−{savings}%</span>
                )}
              </>
            )}
          </span>
          {item.dimensions && item.dimensions.width > 0 && (
            <span className="text-gray-400">{item.dimensions.width}×{item.dimensions.height}</span>
          )}
        </div>

        {item.status === "error" && item.errorMessage && (
          <p className="text-[11px] text-red-500 truncate" title={item.errorMessage}>{item.errorMessage}</p>
        )}

        {/* Actions */}
        <div className="flex gap-1.5 pt-0.5">
          {item.status === "done" && (
            <>
              <button
                onClick={() => onDownload(item)}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-semibold bg-green-600 hover:bg-green-700 text-white transition-colors"
              >
                <Download size={11} />
                Download
              </button>
              <button
                onClick={() => onPreview(item)}
                className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border border-border text-muted hover:border-primary hover:text-primary transition-colors"
                title="Before/After preview"
              >
                <Eye size={11} />
              </button>
            </>
          )}
          {item.status === "error" && (
            <button
              onClick={() => onRetry(item.id)}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-semibold bg-primary hover:bg-primary-hover text-white transition-colors"
            >
              <RotateCcw size={11} />
              Retry
            </button>
          )}
          {item.status === "converting" && (
            <div className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] text-blue-600 bg-blue-50 font-medium">
              <Loader2 size={11} className="animate-spin" />
              Processing…
            </div>
          )}
          {item.status === "idle" && (
            <div className="flex-1 py-1.5 rounded-lg text-[11px] text-center text-gray-300 bg-gray-50 font-medium">
              Waiting…
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden animate-pulse">
      <div className="flex h-[80px] bg-gray-100" />
      <div className="px-3 py-2.5 space-y-2">
        <div className="h-3 bg-gray-100 rounded w-3/4" />
        <div className="h-2.5 bg-gray-100 rounded w-1/2" />
        <div className="h-7 bg-gray-100 rounded" />
      </div>
    </div>
  );
}

// ─── Preview Modal ────────────────────────────────────────────────────────────

function PreviewModal({ item, targetFormat, onClose, onDownload }: {
  item: ImageItem;
  targetFormat: string;
  onClose: () => void;
  onDownload: (item: ImageItem) => void;
}) {
  const [pos, setPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-bold text-foreground">Before / After Preview</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-muted transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Slider */}
        <div className="p-4">
          <div
            ref={containerRef}
            className="relative rounded-xl overflow-hidden bg-[repeating-conic-gradient(#e5e7eb_0%_25%,transparent_0%_50%)_0_0/16px_16px] select-none"
            style={{ aspectRatio: "16/9" }}
          >
            {/* After (full) */}
            {item.convertedPreviewUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.convertedPreviewUrl}
                alt="After"
                className="absolute inset-0 w-full h-full object-contain"
                draggable={false}
              />
            )}
            {/* Before (clipped) */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.previewUrl}
                alt="Before"
                className="absolute inset-0 w-full h-full object-contain"
                draggable={false}
              />
            </div>
            {/* Divider */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_8px_rgba(0,0,0,0.5)] pointer-events-none"
              style={{ left: `${pos}%` }}
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center text-gray-600">
                <SlidersHorizontal size={14} />
              </div>
            </div>
            {/* Labels */}
            <div className="absolute top-2 left-2 bg-black/50 text-white text-[10px] font-bold px-2 py-0.5 rounded">Before</div>
            <div className="absolute top-2 right-2 bg-black/50 text-white text-[10px] font-bold px-2 py-0.5 rounded">After</div>
            {/* Invisible range */}
            <input
              type="range" min={0} max={100} value={pos}
              onChange={(e) => setPos(Number(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-col-resize"
            />
          </div>
        </div>

        {/* Meta + download */}
        <div className="px-5 py-4 border-t border-border flex items-center justify-between gap-4 flex-wrap">
          <div className="flex gap-6 text-[12px] text-muted">
            <span>Original: <strong className="text-foreground">{formatBytes(item.originalSize)}</strong></span>
            {item.convertedSize !== undefined && (
              <span>Converted: <strong className="text-foreground">{formatBytes(item.convertedSize)}</strong> ({targetFormat.toUpperCase()})</span>
            )}
          </div>
          <button
            onClick={() => onDownload(item)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-green-600 hover:bg-green-700 text-white transition-colors"
          >
            <Download size={14} />
            Download
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Options Panel ────────────────────────────────────────────────────────────

function OptionsPanel({
  options,
  setOptions,
  showQuality,
  applyToAll,
  setApplyToAll,
}: {
  options: ConversionOptions;
  setOptions: React.Dispatch<React.SetStateAction<ConversionOptions>>;
  showQuality: boolean;
  applyToAll: boolean;
  setApplyToAll: (v: boolean) => void;
}) {
  const [open, setOpen] = useState(false);

  const set = <K extends keyof ConversionOptions>(key: K, val: ConversionOptions[K]) =>
    setOptions((o) => ({ ...o, [key]: val }));

  return (
    <div className="border border-border rounded-2xl overflow-hidden bg-card shadow-sm">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3.5 bg-gray-50 hover:bg-gray-100 transition-colors text-sm font-semibold text-foreground"
        type="button"
      >
        <span className="flex items-center gap-2">
          <Settings2 size={15} className="text-primary" />
          Conversion Options
        </span>
        <div className="flex items-center gap-3">
          <span className="text-xs font-normal text-muted hidden sm:block">
            Quality {options.quality}% · {options.fit}
          </span>
          {open ? <ChevronUp size={14} className="text-muted" /> : <ChevronDown size={14} className="text-muted" />}
        </div>
      </button>

      {open && (
        <div className="p-5 space-y-6 divide-y divide-border">
          {/* Batch settings */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">Apply settings to all images</p>
              <p className="text-xs text-muted mt-0.5">Use these settings for every image in the queue</p>
            </div>
            <Toggle checked={applyToAll} onChange={setApplyToAll} />
          </div>

          {/* Quality */}
          <div className="pt-5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                Quality
                {!showQuality && <span className="text-xs font-normal text-muted">(JPG · WEBP · AVIF only)</span>}
              </label>
              <span className="text-sm font-bold text-primary">{options.quality}%</span>
            </div>
            <input
              type="range" min={1} max={100} value={options.quality}
              onChange={(e) => set("quality", parseInt(e.target.value))}
              className="custom-range"
              disabled={!showQuality}
            />
            <div className="flex justify-between text-[11px] text-muted">
              <span>1 = smallest</span><span>100 = best</span>
            </div>
          </div>

          {/* Resize */}
          <div className="pt-5 space-y-3">
            <label className="text-sm font-semibold text-foreground block">Resize <span className="text-xs font-normal text-muted">(optional)</span></label>
            <div className="flex items-center gap-2">
              <input
                type="number" placeholder="Width px" min={1} value={options.width}
                onChange={(e) => set("width", e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 bg-background"
              />
              <button
                type="button"
                onClick={() => set("lockAspectRatio", !options.lockAspectRatio)}
                title={options.lockAspectRatio ? "Aspect ratio locked" : "Aspect ratio unlocked"}
                className={`flex-shrink-0 p-2 rounded-xl border transition-colors ${options.lockAspectRatio ? "border-primary bg-primary-light text-primary" : "border-border text-muted hover:border-primary hover:text-primary"}`}
              >
                {options.lockAspectRatio ? <Link2 size={14} /> : <Link2Off size={14} />}
              </button>
              <input
                type="number" placeholder="Height px" min={1} value={options.height}
                onChange={(e) => set("height", e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 bg-background"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted font-medium w-12">Fit:</label>
              <select
                value={options.fit}
                onChange={(e) => set("fit", e.target.value as FitMode)}
                className="flex-1 px-3 py-1.5 text-xs border border-border rounded-lg focus:outline-none focus:border-primary bg-background"
              >
                <option value="inside">Inside (default)</option>
                <option value="contain">Contain</option>
                <option value="cover">Cover</option>
                <option value="fill">Fill (stretch)</option>
                <option value="outside">Outside</option>
              </select>
            </div>
          </div>

          {/* Advanced */}
          <div className="pt-5 space-y-4">
            <p className="text-sm font-semibold text-foreground">Advanced</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Toggle checked={options.stripMetadata} onChange={(v) => set("stripMetadata", v)} label="Strip metadata (EXIF, GPS)" />
              <Toggle checked={options.grayscale} onChange={(v) => set("grayscale", v)} label="Grayscale" />
              <Toggle checked={options.withoutEnlargement} onChange={(v) => set("withoutEnlargement", v)} label="No enlargement" />
            </div>

            {/* Rotate */}
            <div className="flex items-center gap-3">
              <RotateCw size={14} className="text-muted flex-shrink-0" />
              <label className="text-sm text-foreground/80 w-14">Rotate:</label>
              <select
                value={options.rotate}
                onChange={(e) => set("rotate", parseInt(e.target.value) as RotateDeg)}
                className="flex-1 px-3 py-1.5 text-sm border border-border rounded-xl focus:outline-none focus:border-primary bg-background"
              >
                <option value={0}>0° (none)</option>
                <option value={90}>90° clockwise</option>
                <option value={180}>180°</option>
                <option value={270}>270° clockwise</option>
              </select>
            </div>

            {/* Flip / Flop */}
            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => set("flip", !options.flip)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${options.flip ? "bg-primary-light border-primary text-primary" : "border-border text-muted hover:border-primary hover:text-primary"}`}
              >
                <FlipVertical size={13} />
                Flip vertical
              </button>
              <button
                type="button"
                onClick={() => set("flop", !options.flop)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${options.flop ? "bg-primary-light border-primary text-primary" : "border-border text-muted hover:border-primary hover:text-primary"}`}
              >
                <FlipHorizontal size={13} />
                Flip horizontal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Conversion History ───────────────────────────────────────────────────────

function ConversionHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(HISTORY_KEY);
  };

  if (history.length === 0) return null;

  return (
    <div className="border border-border rounded-2xl overflow-hidden bg-card shadow-sm">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3.5 bg-gray-50 hover:bg-gray-100 transition-colors text-sm font-semibold text-foreground"
        type="button"
      >
        <span className="flex items-center gap-2">
          <History size={15} className="text-primary" />
          Recent Conversions
          <span className="ml-1 text-xs font-bold bg-primary text-white px-1.5 py-0.5 rounded-full">{history.length}</span>
        </span>
        {open ? <ChevronUp size={14} className="text-muted" /> : <ChevronDown size={14} className="text-muted" />}
      </button>

      {open && (
        <div className="divide-y divide-border">
          {history.map((h) => (
            <div key={h.id} className="flex items-center justify-between px-4 py-2.5 text-[12px] hover:bg-gray-50">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-muted font-mono truncate max-w-[140px]" title={h.filename}>{h.filename}</span>
                <span className="flex items-center gap-1 flex-shrink-0">
                  <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{h.fromFormat.toUpperCase()}</span>
                  <ArrowRight size={9} className="text-muted" />
                  <span className="text-[10px] font-bold bg-primary text-white px-1.5 py-0.5 rounded">{h.toFormat.toUpperCase()}</span>
                </span>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 text-muted">
                <span>{formatBytes(h.originalSize)} → {formatBytes(h.convertedSize)}</span>
                <span className="text-gray-300">{timeAgo(h.timestamp)}</span>
              </div>
            </div>
          ))}
          <div className="px-4 py-2.5 flex justify-end">
            <button
              onClick={clearHistory}
              className="text-[11px] text-muted hover:text-red-500 transition-colors flex items-center gap-1"
            >
              <Trash2 size={11} />
              Clear history
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sticky Download Bar ──────────────────────────────────────────────────────

function StickyDownloadBar({ doneCount, onDownloadAll }: { doneCount: number; onDownloadAll: () => void }) {
  if (doneCount === 0) return null;
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
      <div className="bg-card border-t border-border shadow-[0_-4px_24px_rgba(0,0,0,0.08)] px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <p className="text-sm text-foreground font-medium">
            <span className="font-bold text-green-600">{doneCount}</span> file{doneCount !== 1 ? "s" : ""} ready to download
          </p>
          <button
            onClick={onDownloadAll}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-primary hover:bg-primary-hover active:scale-95 transition-all shadow-md"
          >
            <Package size={15} />
            Download All as ZIP
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ImageConverter() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [targetFormat, setTargetFormat] = useState<string>("");
  const [options, setOptions] = useState<ConversionOptions>(DEFAULT_OPTIONS);
  const [applyToAll, setApplyToAll] = useState(true);
  const [previewItem, setPreviewItem] = useState<ImageItem | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const { toasts, add: addToast, dismiss: dismissToast } = useToasts();

  // ── History (write) ────────────────────────────────────────────────────────

  const pushHistory = useCallback((entry: Omit<HistoryEntry, "id">) => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      const prev: HistoryEntry[] = raw ? JSON.parse(raw) : [];
      const next = [{ ...entry, id: generateId() }, ...prev].slice(0, 10);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    } catch { /* ignore */ }
  }, []);

  // ── Drop handler ───────────────────────────────────────────────────────────

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onDrop = useCallback(
    async (accepted: File[], rejected: any[]) => {
      if (rejected.length > 0) {
        addToast(`${rejected.length} file(s) rejected. Unsupported type or too large.`, "error");
      }
      const newItems: ImageItem[] = [];
      for (const file of accepted) {
        if (file.size > FREE_MAX_FILE_SIZE) {
          addToast(`"${file.name}" is over 10 MB. Upgrade to Pro for up to 50 MB.`, "error");
          setShowUpgrade(true);
          continue;
        }
        const previewUrl = URL.createObjectURL(file);
        const dimensions = await getImageDimensions(previewUrl);
        newItems.push({
          id: generateId(),
          file,
          previewUrl,
          status: "idle",
          originalSize: file.size,
          dimensions,
        });
      }
      if (newItems.length > 0) {
        setImages((prev) => [...prev, ...newItems]);
      }
    },
    [addToast]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp", ".tiff", ".tif", ".avif", ".svg", ".ico"],
    },
    multiple: true,
    maxSize: PRO_MAX_FILE_SIZE, // Client-side guard at 50 MB; server enforces 10 MB for free
  });

  // ── Image management ───────────────────────────────────────────────────────

  const removeImage = useCallback((id: string) => {
    setImages((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item) {
        URL.revokeObjectURL(item.previewUrl);
        if (item.convertedPreviewUrl) URL.revokeObjectURL(item.convertedPreviewUrl);
      }
      return prev.filter((i) => i.id !== id);
    });
  }, []);

  const clearAll = useCallback(() => {
    setImages((prev) => {
      prev.forEach((item) => {
        URL.revokeObjectURL(item.previewUrl);
        if (item.convertedPreviewUrl) URL.revokeObjectURL(item.convertedPreviewUrl);
      });
      return [];
    });
    setTargetFormat("");
  }, []);

  // ── Conversion ─────────────────────────────────────────────────────────────

  const convertOne = useCallback(
    async (id: string) => {
      if (!targetFormat) return;
      setImages((prev) => prev.map((i) => (i.id === id ? { ...i, status: "converting" } : i)));

      const item = await new Promise<ImageItem | undefined>((resolve) => {
        setImages((prev) => { resolve(prev.find((i) => i.id === id)); return prev; });
      });
      if (!item) return;

      try {
        const fd = new FormData();
        fd.append("file", item.file);
        fd.append("targetFormat", targetFormat.toLowerCase());
        fd.append("quality", options.quality.toString());
        if (options.width)  fd.append("width",  options.width);
        if (options.height) fd.append("height", options.height);
        fd.append("stripMetadata",      options.stripMetadata.toString());
        fd.append("lockAspectRatio",    options.lockAspectRatio.toString());
        fd.append("grayscale",          options.grayscale.toString());
        fd.append("rotate",             options.rotate.toString());
        fd.append("flip",               options.flip.toString());
        fd.append("flop",               options.flop.toString());
        fd.append("fit",                options.fit);
        fd.append("withoutEnlargement", options.withoutEnlargement.toString());

        const res = await fetch("/api/convert", { method: "POST", body: fd });

        if (!res.ok) {
          const json = await res.json().catch(() => ({ error: "Conversion failed" }));
          if (res.status === 429 || json.code === "RATE_LIMIT") {
            setShowUpgrade(true);
            throw new Error("Daily limit reached. Upgrade to Pro for unlimited conversions.");
          }
          throw new Error(json.error || "Conversion failed");
        }

        const blob = await res.blob();
        const convertedPreviewUrl = URL.createObjectURL(blob);

        setImages((prev) =>
          prev.map((i) =>
            i.id === id
              ? { ...i, status: "done", convertedBlob: blob, convertedSize: blob.size, convertedPreviewUrl }
              : i
          )
        );

        pushHistory({
          filename: item.file.name,
          fromFormat: item.file.name.split(".").pop() ?? "unknown",
          toFormat: targetFormat,
          originalSize: item.originalSize,
          convertedSize: blob.size,
          timestamp: Date.now(),
        });

        addToast(`"${item.file.name}" converted successfully.`, "success");
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Conversion failed";
        setImages((prev) =>
          prev.map((i) => (i.id === id ? { ...i, status: "error", errorMessage: msg } : i))
        );
        addToast(`Failed: "${item.file.name}". ${msg}`, "error");
      }
    },
    [targetFormat, options, pushHistory, addToast]
  );

  const convertAll = useCallback(async () => {
    if (!targetFormat) return;
    const ids = images.filter((i) => i.status === "idle" || i.status === "error").map((i) => i.id);
    for (const id of ids) await convertOne(id);
  }, [targetFormat, images, convertOne]);

  // ── Download ───────────────────────────────────────────────────────────────

  const downloadOne = useCallback(
    (item: ImageItem) => {
      if (!item.convertedPreviewUrl) return;
      const ext  = targetFormat.toLowerCase();
      const base = item.file.name.replace(/\.[^/.]+$/, "");
      const a = document.createElement("a");
      a.href = item.convertedPreviewUrl;
      a.download = `${base}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    },
    [targetFormat]
  );

  const downloadAll = useCallback(async () => {
    const done = images.filter((i) => i.status === "done" && i.convertedBlob);
    if (done.length === 0) return;
    addToast("Preparing ZIP download…", "info");
    const zip = new JSZip();
    const ext = targetFormat.toLowerCase();
    done.forEach((item) => {
      const base = item.file.name.replace(/\.[^/.]+$/, "");
      zip.file(`${base}.${ext}`, item.convertedBlob!);
    });
    const zipBlob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "convertimg-bundle.zip";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [images, targetFormat, addToast]);

  // ── Derived state ──────────────────────────────────────────────────────────

  const hasImages      = images.length > 0;
  const doneCount      = images.filter((i) => i.status === "done").length;
  const idleCount      = images.filter((i) => i.status === "idle" || i.status === "error").length;
  const anyConverting  = images.some((i) => i.status === "converting");
  const showQuality    = QUALITY_FORMATS.has(targetFormat.toLowerCase());

  // Sync previewItem when images update (e.g. after re-conversion)
  useEffect(() => {
    if (!previewItem) return;
    const updated = images.find((i) => i.id === previewItem.id);
    if (updated) setPreviewItem(updated);
  }, [images, previewItem]);

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Toasts */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Preview Modal */}
      {previewItem && previewItem.status === "done" && (
        <PreviewModal
          item={previewItem}
          targetFormat={targetFormat}
          onClose={() => setPreviewItem(null)}
          onDownload={downloadOne}
        />
      )}

      {/* Sticky bar */}
      <StickyDownloadBar doneCount={doneCount} onDownloadAll={downloadAll} />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden py-16 px-4 sm:px-6">
        {/* Background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="animate-blob absolute -top-24 -left-16 w-72 h-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="animate-blob2 animation-delay-200 absolute -top-12 right-0 w-64 h-64 rounded-full bg-orange-300/10 blur-3xl" />
          <div className="animate-blob animation-delay-400 absolute top-32 left-1/2 w-48 h-48 rounded-full bg-primary/5 blur-2xl" />
        </div>

        <div className="relative max-w-3xl mx-auto text-center space-y-5">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary-light border border-primary/20 text-primary text-[12px] font-semibold">
            ✦ 100% Free · No Sign-up · Server-side
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl font-extrabold text-foreground leading-tight">
            Convert images to{" "}
            <span className="gradient-text">any format</span>
          </h1>

          <p className="text-muted text-base sm:text-lg max-w-xl mx-auto">
            JPG, PNG, WEBP, AVIF, GIF, TIFF, ICO, all converted securely on our server. No files stored, no limits.
          </p>

          {/* Upload zone */}
          <div
            {...getRootProps()}
            className={`relative cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-200 p-10 flex flex-col items-center justify-center gap-3 text-center select-none mt-2
              ${isDragActive
                ? "border-primary bg-primary-light scale-[1.01] shadow-inner"
                : "border-border hover:border-primary hover:bg-primary-light/30 bg-card"
              }`}
          >
            <input {...getInputProps()} />

            {/* File count badge */}
            {hasImages && (
              <span className="absolute top-3 right-4 bg-primary text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
                {images.length} image{images.length !== 1 ? "s" : ""} selected
              </span>
            )}

            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors shadow-sm ${
              isDragActive ? "bg-primary shadow-md" : "bg-gray-100"
            }`}>
              <Upload size={28} className={isDragActive ? "text-white" : "text-gray-400"} />
            </div>

            <div>
              <p className="text-base font-semibold text-foreground">
                {isDragActive ? "Release to upload" : "Drop images here or click to browse"}
              </p>
              <p className="text-sm text-muted mt-1">
                JPG, PNG, WEBP, GIF, BMP, TIFF, AVIF, ICO. Up to 20 MB each
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Controls (only when files loaded) ── */}
      {hasImages && (
        <section className="max-w-6xl mx-auto w-full px-4 sm:px-6 pb-32 space-y-5">

          {/* Format selector */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">Convert to:</p>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {FORMATS.map((fmt) => {
                const active = targetFormat === fmt;
                return (
                  <div key={fmt} className="relative group flex-shrink-0">
                    <button
                      onClick={() => setTargetFormat(fmt)}
                      className={`flex items-center gap-1 px-4 py-2 rounded-full text-sm font-semibold border transition-all duration-150
                        ${active
                          ? "bg-primary border-primary text-white shadow-md"
                          : "bg-card border-border text-muted hover:border-primary hover:text-primary hover:bg-primary-light/50"
                        }`}
                    >
                      {fmt}
                      <Info size={11} className={active ? "text-white/70" : "text-gray-300 group-hover:text-primary/50"} />
                    </button>
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-52 bg-gray-900 text-white text-[11px] px-3 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl leading-relaxed">
                      <strong className="block mb-0.5">{fmt}</strong>
                      {FORMAT_TIPS[fmt]}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                    </div>
                  </div>
                );
              })}
            </div>
            {!targetFormat && (
              <p className="text-xs text-muted italic">Select a target format above to enable conversion</p>
            )}
          </div>

          {/* Options panel */}
          <OptionsPanel
            options={options}
            setOptions={setOptions}
            showQuality={showQuality}
            applyToAll={applyToAll}
            setApplyToAll={setApplyToAll}
          />

          {/* Action row */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={convertAll}
              disabled={!targetFormat || anyConverting || idleCount === 0}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3 rounded-2xl text-base font-bold text-white transition-all shadow-md
                ${!targetFormat || anyConverting || idleCount === 0
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-gradient-to-r from-primary to-orange-500 hover:from-primary-hover hover:to-orange-600 active:scale-95 animate-pulse-glow"
                }`}
              style={anyConverting ? {} : undefined}
            >
              {anyConverting ? (
                <><Loader2 size={18} className="animate-spin" />Converting…</>
              ) : (
                <><ImageIcon size={18} />Convert {idleCount > 0 ? `${idleCount} ` : ""}Image{idleCount !== 1 ? "s" : ""}</>
              )}
            </button>

            <button
              onClick={clearAll}
              className="flex items-center gap-1.5 px-4 py-3 rounded-2xl text-sm text-muted hover:text-red-500 hover:bg-red-50 border border-border transition-colors"
            >
              <Trash2 size={14} />
              Clear All
            </button>
          </div>

          {/* Image grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {images.map((item) =>
              item.status === "converting" ? (
                <CardSkeleton key={item.id} />
              ) : (
                <ImageCard
                  key={item.id}
                  item={item}
                  targetFormat={targetFormat || "—"}
                  onRemove={removeImage}
                  onDownload={downloadOne}
                  onRetry={convertOne}
                  onPreview={setPreviewItem}
                />
              )
            )}
          </div>

          {/* Conversion history */}
          <ConversionHistory />
        </section>
      )}

      {/* Bottom padding for sticky bar */}
      {doneCount > 0 && <div className="h-20" />}

      {/* Upgrade modal — shown when free limit hit */}
      <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </>
  );
}
