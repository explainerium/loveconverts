"use client";

import { useEffect, useCallback } from "react";

interface ToolShortcutsOptions {
  /** Called when user pastes an image from clipboard */
  onPaste?: (file: File) => void;
  /** Called when user presses Escape */
  onReset?: () => void;
  /** Called when user presses Ctrl/Cmd+Enter */
  onAction?: () => void;
  /** Called when user presses Ctrl/Cmd+D */
  onDownload?: () => void;
  /** Whether the tool is in a state where download makes sense */
  canDownload?: boolean;
  /** Whether the tool is in a state where the action button makes sense */
  canAct?: boolean;
}

export function useToolShortcuts({
  onPaste,
  onReset,
  onAction,
  onDownload,
  canDownload = false,
  canAct = false,
}: ToolShortcutsOptions) {
  // Handle paste event
  const handlePaste = useCallback(
    (e: ClipboardEvent) => {
      if (!onPaste) return;
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;

      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const blob = item.getAsFile();
          if (blob) {
            // Create a proper File with a name
            const ext = item.type.split("/")[1] || "png";
            const file = new File([blob], `pasted-image.${ext}`, { type: item.type });
            onPaste(file);
            showToast("Image pasted from clipboard");
          }
          return;
        }
      }
    },
    [onPaste]
  );

  // Handle keyboard shortcuts
  const handleKeydown = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;

      const mod = e.metaKey || e.ctrlKey;

      if (e.key === "Escape" && onReset) {
        e.preventDefault();
        onReset();
        return;
      }

      if (mod && e.key === "Enter" && onAction && canAct) {
        e.preventDefault();
        onAction();
        return;
      }

      if (mod && (e.key === "d" || e.key === "D") && onDownload && canDownload) {
        e.preventDefault();
        onDownload();
        return;
      }
    },
    [onReset, onAction, onDownload, canAct, canDownload]
  );

  useEffect(() => {
    document.addEventListener("paste", handlePaste);
    document.addEventListener("keydown", handleKeydown);
    return () => {
      document.removeEventListener("paste", handlePaste);
      document.removeEventListener("keydown", handleKeydown);
    };
  }, [handlePaste, handleKeydown]);
}

function showToast(message: string) {
  // Simple toast that auto-dismisses
  const existing = document.getElementById("lc-toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.id = "lc-toast";
  toast.textContent = message;
  toast.style.cssText =
    "position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#1A1A2E;color:white;padding:10px 20px;border-radius:12px;font-size:13px;font-weight:600;z-index:9999;animation:fadeInUp 0.3s ease-out;box-shadow:0 4px 12px rgba(0,0,0,0.15);";
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.3s";
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}
