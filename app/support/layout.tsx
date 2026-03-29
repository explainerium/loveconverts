import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Support Center — Get Help",
  description: "Need help with LoveConverts? Submit a support ticket and we will get back to you. Report bugs, request features, or ask questions.",
  alternates: { canonical: "https://loveconverts.com/support" },
};

export default function SupportLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
