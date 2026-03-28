import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Compress Image Online — Free",
  description: "Reduce image file size while keeping quality. Supports JPG, PNG, WEBP, AVIF. Free, fast, server-side compression.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
