import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Crop Image Online — Free",
  description: "Crop and trim images to any size or aspect ratio. Free online image cropping tool.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
