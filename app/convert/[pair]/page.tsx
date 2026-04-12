import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { ALL_PAIRS, getPairData } from "@/lib/conversion-pairs";
import ImageConverter from "@/app/components/ImageConverter";
import JsonLd from "@/app/components/JsonLd";

export function generateStaticParams() {
  return ALL_PAIRS.map((pair) => ({ pair }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ pair: string }>;
}): Promise<Metadata> {
  const { pair } = await params;
  const data = getPairData(pair);
  if (!data) return {};

  return {
    title: data.title,
    description: data.description,
    alternates: { canonical: `https://loveconverts.com/convert/${pair}` },
    openGraph: {
      title: data.title,
      description: data.description,
      url: `https://loveconverts.com/convert/${pair}`,
    },
  };
}

export default async function ConvertPairPage({
  params,
}: {
  params: Promise<{ pair: string }>;
}) {
  const { pair } = await params;
  const data = getPairData(pair);
  if (!data) notFound();

  const acceptTypes = { [data.mime]: [] };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: data.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };

  const relatedPairs = data.related
    .map((r) => getPairData(r))
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-background">
      <JsonLd data={faqSchema} />

      {/* Hero */}
      <div className="max-w-4xl mx-auto px-4 pt-12 pb-4">
        <div className="text-center space-y-3 mb-8">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-primary bg-primary-light px-3 py-1 rounded-full">
            {data.from} <ArrowRight size={12} /> {data.to}
          </div>
          <h1 className="text-4xl font-extrabold text-foreground">{data.h1}</h1>
          <p className="text-muted max-w-xl mx-auto leading-relaxed">{data.intro}</p>
        </div>
      </div>

      {/* Converter (embedded, hero hidden) */}
      <ImageConverter
        defaultFormat={data.to}
        acceptTypes={acceptTypes}
        hideHero
      />

      {/* FAQ */}
      {data.faqs.length > 0 && (
        <div className="max-w-3xl mx-auto px-4 py-12">
          <h2 className="text-xl font-bold text-foreground mb-6">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {data.faqs.map((faq, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-5">
                <h3 className="font-semibold text-foreground mb-2">{faq.q}</h3>
                <p className="text-sm text-muted leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Related conversions */}
      {relatedPairs.length > 0 && (
        <div className="max-w-3xl mx-auto px-4 pb-12">
          <h3 className="text-sm font-bold text-muted uppercase tracking-wider mb-4">
            Related Conversions
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {relatedPairs.map((rp) =>
              rp ? (
                <Link
                  key={rp.pair}
                  href={`/convert/${rp.pair}`}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-border hover:border-primary/30 hover:shadow-sm transition-all text-center group"
                >
                  <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    {rp.from} to {rp.to}
                  </span>
                </Link>
              ) : null
            )}
          </div>
        </div>
      )}
    </div>
  );
}
