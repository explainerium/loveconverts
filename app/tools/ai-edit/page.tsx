"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  Wand2, Upload, Download, AlertCircle, Loader2, Zap,
  Minimize2, Maximize2, Crop, Sparkles,
} from "lucide-react";
import Link from "next/link";

function fmtBytes(n: number) {
  if (n < 1024) return n + " B";
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + " KB";
  return (n / (1024 * 1024)).toFixed(2) + " MB";
}

const EXAMPLE_PROMPTS = [
  "Make the background blue",
  "Add snow falling",
  "Turn into oil painting",
  "Make it look cinematic",
  "Add sunset lighting",
  "Make it black and white",
];

export default function AiEditPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((accepted: File[]) => {
    setError(null);
    setResultUrl(null);
    if (accepted.length === 0) return;
    const f = accepted[0];
    if (f.size > 20 * 1024 * 1024) {
      setError("File exceeds 20 MB limit.");
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
    },
    maxSize: 20 * 1024 * 1024,
    multiple: false,
  });

  const clearFile = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    setResultUrl(null);
    setError(null);
    setPrompt("");
  };

  const editImage = async () => {
    if (!file || !prompt.trim()) return;
    setProcessing(true);
    setError(null);
    setResultUrl(null);

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("prompt", prompt.trim());

      const res = await fetch("/api/tools/ai-edit", {
        method: "POST",
        body: fd,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "AI editing failed");
        return;
      }

      if (data.url) {
        setResultUrl(typeof data.url === "string" ? data.url : String(data.url));
      } else {
        setError("No result returned from AI.");
      }
    } catch {
      setError("AI editing failed. Please try again.");
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
            <Wand2 size={12} /> AI IMAGE EDITOR
          </div>
          <h1 className="text-3xl font-extrabold text-foreground">
            Edit Images with AI
          </h1>
          <p className="text-muted max-w-md mx-auto text-sm">
            Describe what you want to change and AI will edit your image. Change backgrounds,
            add effects, transform styles.
          </p>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">
            <Sparkles size={10} /> Powered by AI
          </span>
        </div>

        {/* Drop zone */}
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
            <Upload size={32} className={`mx-auto mb-3 ${isDragActive ? "text-primary" : "text-muted"}`} />
            <p className="font-semibold text-foreground">
              {isDragActive ? "Drop image here" : "Drag and drop an image or click to browse"}
            </p>
            <p className="text-xs text-muted mt-1">JPG, PNG, WEBP. Max 20 MB</p>
          </div>
        )}

        {/* File selected, prompt input */}
        {file && !resultUrl && !processing && (
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4">
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview || ""} alt={file.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{file.name}</p>
                <p className="text-xs text-muted mt-0.5">{fmtBytes(file.size)}</p>
              </div>
              <button onClick={clearFile} className="p-1.5 text-muted hover:text-red-500 transition-colors flex-shrink-0">
                <Wand2 size={14} />
              </button>
            </div>

            {/* Prompt input */}
            <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">
                  Describe your edit
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g. Make the background blue, add snow falling, turn into oil painting..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 text-sm border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 bg-background resize-none"
                />
              </div>

              {/* Example prompts */}
              <div>
                <span className="text-[10px] font-bold text-muted uppercase tracking-wider mb-2 block">Try these</span>
                <div className="flex flex-wrap gap-1.5">
                  {EXAMPLE_PROMPTS.map((p) => (
                    <button
                      key={p}
                      onClick={() => setPrompt(p)}
                      className="text-[11px] px-2.5 py-1 rounded-full border border-border text-muted hover:border-primary/40 hover:text-primary transition-colors"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={editImage}
              disabled={!prompt.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Wand2 size={16} />
              Edit with AI
            </button>
          </div>
        )}

        {/* Processing */}
        {processing && (
          <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-3">
            <Loader2 size={32} className="animate-spin text-primary mx-auto" />
            <p className="text-sm font-semibold text-foreground">AI is editing your image...</p>
            <p className="text-xs text-muted">This can take 10 to 30 seconds depending on the edit</p>
          </div>
        )}

        {/* Result: before / after */}
        {resultUrl && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-foreground">Before and After</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <span className="text-xs font-semibold text-muted uppercase">Original</span>
                <div className="rounded-xl overflow-hidden border border-border bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview || ""} alt="Original" className="w-full h-auto" />
                </div>
              </div>
              <div className="space-y-2">
                <span className="text-xs font-semibold text-muted uppercase">AI Edited</span>
                <div className="rounded-xl overflow-hidden border border-border bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={resultUrl} alt="AI edited result" className="w-full h-auto" />
                </div>
              </div>
            </div>

            <p className="text-xs text-muted bg-gray-50 border border-border rounded-lg px-3 py-2">
              <strong>Prompt:</strong> {prompt}
            </p>

            <div className="flex gap-3">
              <a
                href={resultUrl}
                download={(file?.name.replace(/\.[^/.]+$/, "") || "image") + "-ai-edit.png"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary-hover transition-colors"
              >
                <Download size={16} /> Download
              </a>
              <button
                onClick={() => { setResultUrl(null); setPrompt(""); }}
                className="px-4 py-3 text-sm font-bold text-primary border border-primary/30 rounded-xl hover:bg-primary-light transition-colors"
              >
                Edit Again
              </button>
              <button
                onClick={clearFile}
                className="px-4 py-3 text-sm font-bold text-muted border border-border rounded-xl hover:border-primary/40 transition-colors"
              >
                New Image
              </button>
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
            <h3 className="text-sm font-bold text-foreground">How AI editing works</h3>
          </div>
          <p className="text-sm text-muted leading-relaxed">
            Upload an image and describe the change you want in plain English. The AI understands
            instructions like changing backgrounds, adding weather effects, applying artistic styles,
            adjusting lighting, and much more. Your images are processed via AI and not stored.
          </p>
        </div>

        {/* Related Tools */}
        <div>
          <h3 className="text-sm font-bold text-muted uppercase tracking-wider mb-3">Related Tools</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { href: "/tools/remove-background", icon: Minimize2, label: "Remove Background" },
              { href: "/tools/enhance", icon: Maximize2, label: "AI Enhance" },
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
