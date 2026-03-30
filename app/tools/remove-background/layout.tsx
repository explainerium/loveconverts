import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Remove Image Background Free Online",
  description:
    "Remove backgrounds from images online. Get transparent PNG output. Free, no signup required.",
  alternates: { canonical: "https://loveconverts.com/tools/remove-background" },
  openGraph: { url: "https://loveconverts.com/tools/remove-background" },
};
export default function RemoveBgLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
