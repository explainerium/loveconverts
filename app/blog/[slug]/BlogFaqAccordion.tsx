"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface Props {
  items: { question: string; answer: string }[];
}

export default function BlogFaqAccordion({ items }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-2">
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div
            key={i}
            className="bg-card border border-border rounded-xl overflow-hidden"
          >
            <button
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className="w-full flex items-center justify-between px-5 py-4 text-left"
            >
              <span className="font-semibold text-foreground text-sm pr-4">
                {item.question}
              </span>
              <ChevronDown
                size={16}
                className={`text-muted flex-shrink-0 transition-transform duration-200 ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {isOpen && (
              <div className="px-5 pb-4">
                <p className="text-sm text-muted leading-relaxed">
                  {item.answer}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
