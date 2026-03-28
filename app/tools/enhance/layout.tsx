import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Photo Enhancer for Kids — Free Online",
  description:
    "Fun AI photo enhancer for kids! Magic Fix, Super Zoom, Cartoon, Sketch, Neon, Pop Art, Superhero mode and more. 100% free, no sign-up.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
