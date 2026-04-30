/**
 * Renders SoftwareApplication + BreadcrumbList JSON-LD schemas for a tool page.
 * Optionally renders an FAQPage schema if `faq` is provided.
 *
 * Usage in a tool's layout.tsx:
 *   <ToolSchemas
 *     name="Compress Image"
 *     slug="compress"
 *     description="Reduce image file size online for free."
 *   />
 */

interface FaqItem {
  q: string;
  a: string;
}

interface Props {
  name: string;
  slug: string;
  description: string;
  faq?: FaqItem[];
}

export default function ToolSchemas({ name, slug, description, faq }: Props) {
  const url = `https://loveconverts.com/tools/${slug}`;

  const software = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name,
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    description,
    url,
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://loveconverts.com" },
      { "@type": "ListItem", position: 2, name: "Tools", item: "https://loveconverts.com/tools" },
      { "@type": "ListItem", position: 3, name, item: url },
    ],
  };

  const faqSchema = faq?.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faq.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      }
    : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(software) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
    </>
  );
}
