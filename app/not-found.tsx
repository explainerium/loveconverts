import Link from "next/link";
import { ImageIcon, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center space-y-6">
      {/* Icon */}
      <div className="w-20 h-20 rounded-3xl bg-primary-light flex items-center justify-center">
        <ImageIcon size={36} className="text-primary" />
      </div>

      {/* Text */}
      <div className="space-y-2">
        <p className="text-8xl font-black text-gray-100 select-none">404</p>
        <h1 className="text-2xl font-extrabold text-foreground -mt-4">Page not found</h1>
        <p className="text-muted max-w-sm">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/"
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-semibold text-white bg-primary hover:bg-primary-hover transition-colors shadow-md active:scale-95"
        >
          <ImageIcon size={16} />
          Go to Converter
        </Link>
        <Link
          href="/how-it-works"
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-semibold border border-border text-muted hover:border-primary hover:text-primary transition-colors"
        >
          <ArrowLeft size={16} />
          How It Works
        </Link>
      </div>
    </div>
  );
}
