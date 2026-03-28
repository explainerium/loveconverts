"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Headphones, HelpCircle, X, MessageSquare } from "lucide-react";

const HIDE_ON = ["/support", "/faq"];

export default function FloatingSupport() {
  const pathname = usePathname();
  const [open,      setOpen]      = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (HIDE_ON.includes(pathname) || dismissed) return null;

  return (
    <div className="fixed bottom-6 left-6 z-50">
      {/* Slide-up panel */}
      {open && (
        <div className="mb-3 w-64 bg-card border border-border rounded-2xl shadow-xl overflow-hidden animate-slide-up">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-gradient-to-r from-primary to-orange-500">
            <div className="flex items-center gap-2">
              <Headphones size={15} className="text-white" />
              <span className="text-white text-sm font-semibold">Need help?</span>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white transition-colors">
              <X size={15} />
            </button>
          </div>
          <div className="p-3 space-y-2">
            <Link
              href="/support"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-primary-light transition-colors group"
            >
              <div className="w-8 h-8 rounded-lg bg-primary-light group-hover:bg-primary/20 flex items-center justify-center flex-shrink-0 transition-colors">
                <MessageSquare size={15} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Submit an Inquiry</p>
                <p className="text-[11px] text-muted">We reply within 24 hours</p>
              </div>
            </Link>
            <Link
              href="/faq"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors group"
            >
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                <HelpCircle size={15} className="text-muted" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">View FAQ</p>
                <p className="text-[11px] text-muted">Common questions answered</p>
              </div>
            </Link>
          </div>
          <div className="px-4 py-2.5 border-t border-border">
            <button
              onClick={() => setDismissed(true)}
              className="text-[11px] text-muted hover:text-foreground transition-colors w-full text-center"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Trigger button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95"
        style={{
          background: open
            ? "#e03c3c"
            : "linear-gradient(135deg, #FF4747 0%, #FF8C42 100%)",
        }}
        aria-label="Support"
      >
        {open ? (
          <X size={20} className="text-white" />
        ) : (
          <Headphones size={20} className="text-white" />
        )}
      </button>
    </div>
  );
}
