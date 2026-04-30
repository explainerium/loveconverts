import type { Metadata } from "next";
import ToolSchemas from "@/app/components/ToolSchemas";
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
  return (
    <>
      <ToolSchemas
        name="Remove Background"
        slug="remove-background"
        description="Remove backgrounds from images online. Get transparent PNG output."
      />
      {children}
    </>
  );
}
