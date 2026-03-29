import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://loveconverts.com";
  const today = new Date().toISOString();

  return [
    { url: baseUrl, lastModified: today, changeFrequency: "weekly", priority: 1.0 },
    { url: `${baseUrl}/tools/compress`, lastModified: today, changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/tools/resize`, lastModified: today, changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/tools/crop`, lastModified: today, changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/tools/convert-to-jpg`, lastModified: today, changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/tools/photo-editor`, lastModified: today, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/tools`, lastModified: today, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/downloaders`, lastModified: today, changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/downloaders/tiktok`, lastModified: today, changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/downloaders/instagram`, lastModified: today, changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/downloaders/facebook`, lastModified: today, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/downloaders/youtube`, lastModified: today, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/downloaders/youtube-shorts`, lastModified: today, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/downloaders/twitter`, lastModified: today, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/downloaders/pinterest`, lastModified: today, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/downloaders/soundcloud`, lastModified: today, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/downloaders/vimeo`, lastModified: today, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/downloaders/dailymotion`, lastModified: today, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/how-it-works`, lastModified: today, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/faq`, lastModified: today, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/about`, lastModified: today, changeFrequency: "yearly", priority: 0.5 },
    { url: `${baseUrl}/support`, lastModified: today, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/terms`, lastModified: today, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/privacy`, lastModified: today, changeFrequency: "yearly", priority: 0.3 },
  ];
}
