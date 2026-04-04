"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Wand2, Upload, Download, CheckCircle2, Loader2, Minimize2, Maximize2, Crop, Sparkles, ImageIcon, X } from "lucide-react";
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
];

type Stage = "upload" | "editing" | "done";

export default function AiEditPage() {
  const [stage, setStage] = useState<Stage>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [usedPrompt, setUsedPrompt] = useState("");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted.length === 0) return;
    setError(null);
    const f = accepted[0];
    if (f.size > 20 * 1024 * 1024) {
      setError("File exceeds 20 MB limit.");
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }, [preview]);

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

  const removeFile = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    setError(null);
    setPrompt("");
  };

  const editImage = async () => {
    if (!file || !prompt.trim()) return;
    setStage("editing");
    setError(null);
    setResultUrl(null);
    setUsedPrompt(prompt.trim());

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
        setStage("upload");
        return;
      }

      if (data.url) {
        setResultUrl(typeof data.url === "string" ? data.url : String(data.url));
        setStage("done");
      } else {
        setError("No result returned from AI.");
        setStage("upload");
      }
    } catch {
      setError("AI editing failed. Please try again.");
      setStage("upload");
    }
  };

  const editAgain = () => {
    setResultUrl(null);
    setPrompt("");
    setUsedPrompt("");
    setStage("upload");
    setError(null);
  };

  const fullReset = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    setResultUrl(null);
    setPrompt("");
    setUsedPrompt("");
    setStage("upload");
    setError(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ─── STAGE 1: Upload ─── */}
      {stage === "upload" && (
        <div className="max-w-4xl mx-auto px-4 py-16">
          {/* Hero */}
          <div className="text-center space-y-3 mb-10">
            <h1 className="text-4xl font-extrabold text-foreground">AI Image Editor</h1>
            <p className="text-muted max-w-lg mx-auto">
              Describe what you want to change and AI will edit your image. Change backgrounds, add effects, transform styles.
            </p>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">
              <Sparkles size={10} /> Powered by AI
            </span>
          </div>

          {/* Drop zone */}
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
                {isDragActive ? "Drop image here" : "Select an image"}
              </p>
              <p className="text-sm text-muted">or drag and drop it here</p>
              <p className="text-xs text-muted mt-3">JPG, PNG, WEBP. Up to 20 MB.</p>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto space-y-4">
              {/* File preview */}
              <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4">
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview || ""} alt={file.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{file.name}</p>
                  <p className="text-xs text-muted mt-0.5">{fmtBytes(file.size)}</p>
                </div>
                <button
                  onClick={removeFile}
                  className="w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors flex-shrink-0"
                >
                  <X size={12} />
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

                {/* Example prompt pills */}
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

              {/* Edit with AI button */}
              <button
                onClick={editImage}
                disabled={!prompt.trim()}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary text-white text-base font-bold rounded-2xl hover:bg-primary-hover transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Wand2 size={18} />
                Edit with AI
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

      {/* ─── STAGE 2: Editing ─── */}
      {stage === "editing" && (
        <div className="max-w-md mx-auto px-4 py-32 text-center space-y-6">
          <Loader2 size={48} className="animate-spin text-primary mx-auto" />
          <div>
            <h2 className="text-xl font-bold text-foreground mb-1">AI is editing your image...</h2>
            <p className="text-sm text-muted">
              This can take 10 to 30 seconds
            </p>
          </div>
        </div>
      )}

      {/* ─── STAGE 3: Done ─── */}
      {stage === "done" && resultUrl && (
        <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">
          {/* Success card */}
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center space-y-2">
            <CheckCircle2 size={40} className="text-green-500 mx-auto" />
            <h2 className="text-xl font-bold text-foreground">Image edited successfully</h2>
            <p className="text-sm text-green-700">
              Your AI-edited image is ready to download
            </p>
          </div>

          {/* Before / After */}
          <div>
            <h3 className="text-sm font-bold text-foreground mb-3">Before and After</h3>
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
          </div>

          {/* Prompt shown */}
          <p className="text-xs text-muted bg-gray-50 border border-border rounded-lg px-3 py-2">
            <strong>Prompt:</strong> {usedPrompt}
          </p>

          {/* Download button */}
          <a
            href={resultUrl}
            download={(file?.name.replace(/\.[^/.]+$/, "") || "image") + "-ai-edit.png"}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary text-white text-base font-bold rounded-2xl hover:bg-primary-hover transition-colors shadow-lg"
          >
            <Download size={18} />
            Download Edited Image
          </a>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={editAgain}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-primary border border-primary/30 rounded-xl hover:bg-primary-light transition-colors"
            >
              Edit Again
            </button>
            <button
              onClick={fullReset}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-muted border border-border rounded-xl hover:border-primary/40 transition-colors"
            >
              New Image
            </button>
          </div>
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
                  { step: "1", title: "Upload", desc: "Select an image from your device" },
                  { step: "2", title: "Describe", desc: "Tell the AI what changes you want" },
                  { step: "3", title: "Download", desc: "Get your AI-edited image instantly" },
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
                { label: "Natural language", sub: "Plain English prompts" },
                { label: "Any style change", sub: "Backgrounds, effects, art" },
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
              { href: "/tools/remove-background", icon: Minimize2, label: "Remove Background" },
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
