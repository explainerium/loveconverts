"use client";

import { X, Zap, CheckCircle2 } from "lucide-react";
import Link from "next/link";

const PRO_FEATURES = [
  "Unlimited conversions per day",
  "Up to 50 MB per file",
  "Priority processing speed",
  "Batch processing up to 50 files",
  "Advanced options (rotate, flip, grayscale)",
  "No watermarks or ads",
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function UpgradeModal({ isOpen, onClose }: Props) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-orange-500 px-6 py-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap size={20} />
              <h2 className="font-extrabold text-lg">Upgrade to Pro</h2>
            </div>
            <button onClick={onClose} className="opacity-70 hover:opacity-100 transition-opacity p-1">
              <X size={18} />
            </button>
          </div>
          <p className="text-white/80 text-sm mt-1">You&apos;ve reached your daily free limit.</p>
        </div>

        {/* Features */}
        <div className="px-6 py-5 space-y-3">
          <p className="text-sm font-semibold text-foreground mb-4">Pro Plan includes:</p>
          <div className="space-y-2.5">
            {PRO_FEATURES.map((f) => (
              <div key={f} className="flex items-center gap-2.5 text-sm text-foreground">
                <CheckCircle2 size={15} className="text-green-500 flex-shrink-0" />
                {f}
              </div>
            ))}
          </div>
        </div>

        {/* Pricing */}
        <div className="px-6 pb-6 space-y-3">
          <div className="bg-background border border-border rounded-xl p-4 space-y-2">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-foreground">$4.99</span>
              <span className="text-muted text-sm">/month</span>
            </div>
            <p className="text-xs text-muted">or <strong className="text-foreground">$39.99/year</strong> , save 33%</p>
          </div>

          <Link
            href="/upgrade"
            onClick={onClose}
            className="block w-full text-center py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-primary to-orange-500 hover:from-primary-hover hover:to-orange-600 transition-all shadow-md"
          >
            Upgrade Now: $4.99/month
          </Link>

          <button
            onClick={onClose}
            className="w-full py-2 text-sm text-muted hover:text-foreground transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
