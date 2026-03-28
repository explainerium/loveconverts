import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Photo Editor Online — Free",
  description: "Edit photos online — adjust brightness, contrast, saturation, apply filters. Free with live preview.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
