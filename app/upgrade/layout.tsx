import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Upgrade to Pro — More Conversions & Larger Files",
  description: "Upgrade to LoveConverts Pro for unlimited conversions, larger file uploads up to 50MB, and priority support.",
  alternates: { canonical: "https://loveconverts.com/upgrade" },
};

export default function UpgradeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
