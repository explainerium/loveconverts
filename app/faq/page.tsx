import type { Metadata } from "next";
import FaqAccordion from "./FaqAccordion";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Frequently asked questions about LoveConverts — file storage, supported formats, limits, and more.",
};

export default function FaqPage() {
  return (
    <div className="bg-background">
      <FaqAccordion />
    </div>
  );
}
