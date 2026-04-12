import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compress Video Online Free: Reduce MP4 File Size",
  description:
    "Compress MP4, MOV, AVI, WEBM and MKV videos online for free. Reduce video file size by up to 90% without losing quality. No signup, no watermark, files never stored.",
  keywords: [
    "compress video",
    "video compressor",
    "reduce video size",
    "compress mp4",
    "compress mov",
    "shrink video",
    "video size reducer",
    "free video compressor",
    "online video compressor",
    "compress video for whatsapp",
    "compress video for email",
  ],
  alternates: { canonical: "https://loveconverts.com/tools/compress-video" },
  openGraph: {
    title: "Compress Video Online Free: Reduce MP4 File Size",
    description:
      "Shrink MP4, MOV, AVI, WEBM and MKV videos up to 90% smaller. Free, no signup, files never stored.",
    url: "https://loveconverts.com/tools/compress-video",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Compress Video Online Free",
    description:
      "Reduce MP4, MOV, AVI, WEBM video file size up to 90% smaller. Free, no signup.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "LoveConverts Video Compressor",
  applicationCategory: "MultimediaApplication",
  operatingSystem: "Any",
  description:
    "Free online video compressor. Reduce MP4, MOV, AVI, WEBM and MKV file size by up to 90% without losing quality.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  url: "https://loveconverts.com/tools/compress-video",
  featureList: [
    "Compress MP4, MOV, AVI, WEBM, MKV",
    "Up to 90% size reduction",
    "4 quality presets",
    "No watermark",
    "No signup required",
    "Files never stored",
  ],
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}
