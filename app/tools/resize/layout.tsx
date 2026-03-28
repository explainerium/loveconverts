import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Resize Image Online — Free",
  description: "Resize images to any dimension. Social media presets included. Free online image resizer.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
