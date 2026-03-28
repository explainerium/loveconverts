"use client";

import { useState } from "react";

export default function AdminDownloaderToggle({
  platform,
  disabled: initialDisabled,
}: {
  platform: string;
  disabled: boolean;
}) {
  const [disabled, setDisabled] = useState(initialDisabled);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (!confirm(`${disabled ? "Enable" : "Disable"} ${platform} downloader?`)) return;
    setLoading(true);
    try {
      await fetch(`/api/admin/downloaders/${platform}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disabled: !disabled }),
      });
      setDisabled(d => !d);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`text-xs font-semibold px-2.5 py-1 rounded-full border transition-colors disabled:opacity-50 ${
        disabled
          ? "bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
          : "bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
      }`}
    >
      {loading ? "..." : disabled ? "Disabled" : "Active"}
    </button>
  );
}
