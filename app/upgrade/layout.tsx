import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Pricing — Free vs Pro",
  description: "Compare LoveConverts Free and Pro plans. Unlimited conversions, bigger files, batch processing, and AI tools.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
