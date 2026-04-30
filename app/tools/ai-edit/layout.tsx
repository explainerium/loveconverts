import type { Metadata } from "next";
import ToolSchemas from "@/app/components/ToolSchemas";

export const metadata: Metadata = {
  title: "AI Image Editor: Edit Photos with Text Prompts",
  description: "Edit images using AI. Describe what you want to change and AI will do it. Change backgrounds, add effects, transform styles. Free, no signup.",
  alternates: { canonical: "https://loveconverts.com/tools/ai-edit" },
  openGraph: { url: "https://loveconverts.com/tools/ai-edit" },
};

export default function AiEditLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ToolSchemas
        name="AI Image Editor"
        slug="ai-edit"
        description="Edit images using AI. Describe what you want to change and AI will do it."
      />
      {children}
    </>
  );
}
