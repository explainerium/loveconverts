"use client";

import { useState } from "react";
import { Keyboard, ChevronDown } from "lucide-react";

const SHORTCUTS = [
  { keys: "Ctrl+V / Cmd+V", action: "Paste image from clipboard" },
  { keys: "Escape", action: "Clear all files and reset" },
  { keys: "Ctrl+Enter", action: "Start conversion/processing" },
  { keys: "Ctrl+D", action: "Download result" },
];

export default function KeyboardShortcuts() {
  const [open, setOpen] = useState(false);

  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors"
      >
        <Keyboard size={13} />
        <span>Keyboard shortcuts</span>
        <ChevronDown
          size={12}
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="mt-2 bg-card border border-border rounded-xl p-4">
          <div className="grid grid-cols-2 gap-2">
            {SHORTCUTS.map((s) => (
              <div key={s.keys} className="flex items-center gap-3">
                <kbd className="text-[10px] font-mono font-bold bg-gray-100 text-foreground px-2 py-0.5 rounded border border-border whitespace-nowrap">
                  {s.keys}
                </kbd>
                <span className="text-xs text-muted">{s.action}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
