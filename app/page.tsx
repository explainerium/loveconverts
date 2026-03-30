import type { Metadata } from "next";
import ImageConverter from "./components/ImageConverter";
import JsonLd from "./components/JsonLd";

export const metadata: Metadata = {
  title: "Free Image Converter: JPG PNG WEBP AVIF Online",
  description:
    "Convert images between JPG, PNG, WEBP, AVIF, GIF, BMP, TIFF and ICO formats. Free, fast, server-side processing. No signup. No file storage.",
  openGraph: {
    title: "Free Image Converter: JPG PNG WEBP AVIF Online",
    description:
      "Convert images between JPG, PNG, WEBP, AVIF, GIF, BMP, TIFF and ICO formats. Free, fast, server-side processing. No signup. No file storage.",
    url: "https://loveconverts.com",
  },
  alternates: { canonical: "https://loveconverts.com" },
};

export default function Page() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "LoveConverts",
          url: "https://loveconverts.com",
          description: "Free online image converter and social media downloader",
          potentialAction: {
            "@type": "SearchAction",
            target: {
              "@type": "EntryPoint",
              urlTemplate: "https://loveconverts.com/?q={search_term_string}",
            },
            "query-input": "required name=search_term_string",
          },
        }}
      />
      <ImageConverter />
    </>
  );
}
