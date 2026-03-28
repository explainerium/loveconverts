"use client";

import { Heart } from "lucide-react";

export default function DonateButton() {
  return (
    <button
      className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-semibold text-white bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 transition-all shadow-md active:scale-95"
      onClick={() => alert("Thank you for your support! Donate link coming soon.")}
      type="button"
    >
      <Heart size={17} />
      Donate (coming soon)
    </button>
  );
}
