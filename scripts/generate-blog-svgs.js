/* eslint-disable */
// Generates SVG featured images for blog posts.
// Run: node scripts/generate-blog-svgs.js

const fs = require("fs");
const path = require("path");

const OUT_DIR = path.join(__dirname, "..", "public", "blog", "images");

const POSTS = [
  { slug: "how-to-add-text-to-image-online", title: "Add Text\nto Image", icon: "Aa", bg: "#1a1a2e", accent: "#e8563a", shape: "circles" },
  { slug: "how-to-download-vimeo-videos-free", title: "Download\nVimeo Videos", icon: "\u25B6", bg: "#0a1628", accent: "#1ab7ea", shape: "waves" },
  { slug: "how-to-download-youtube-shorts-free", title: "Download\nYouTube Shorts", icon: "\u25B6", bg: "#1a0a0a", accent: "#FF0000", shape: "bars" },
  { slug: "how-to-convert-jpg-to-png", title: "JPG to PNG\nConversion", icon: "\u2192", bg: "#0f1922", accent: "#22c55e", shape: "grid" },
  { slug: "how-to-watermark-photos-online-free", title: "Watermark\nYour Photos", icon: "\u00A9", bg: "#1a1a2e", accent: "#8b5cf6", shape: "diagonal" },
  { slug: "how-to-reduce-screenshot-file-size", title: "Reduce\nScreenshot Size", icon: "\u2193", bg: "#111827", accent: "#3b82f6", shape: "dots" },
  { slug: "how-to-make-image-background-transparent", title: "Transparent\nBackground", icon: "\u2B1A", bg: "#0d1117", accent: "#ec4899", shape: "checker" },
  { slug: "how-to-convert-images-for-shopify", title: "Images for\nShopify", icon: "\uD83D\uDED2", bg: "#1a1a2e", accent: "#96bf48", shape: "circles" },
  { slug: "how-to-convert-images-for-etsy", title: "Images for\nEtsy Listings", icon: "\uD83C\uDFA8", bg: "#1e1108", accent: "#f1641e", shape: "waves" },
  { slug: "how-to-convert-raw-to-jpg", title: "RAW to JPG\nConversion", icon: "\uD83D\uDCF7", bg: "#1a1a2e", accent: "#e8563a", shape: "bars" },
  { slug: "how-to-compress-image-for-whatsapp", title: "Compress for\nWhatsApp", icon: "\uD83D\uDCAC", bg: "#0a1a0a", accent: "#25d366", shape: "grid" },
  { slug: "how-to-convert-heic-to-png", title: "HEIC to PNG\nConversion", icon: "\uD83D\uDCF1", bg: "#1a1a2e", accent: "#007aff", shape: "diagonal" },
  { slug: "how-to-create-gif-from-images", title: "Create GIF\nfrom Images", icon: "GIF", bg: "#1a0f2e", accent: "#a855f7", shape: "dots" },
  { slug: "how-to-edit-photos-online-without-photoshop", title: "Edit Photos\nNo Photoshop", icon: "\u270F\uFE0F", bg: "#111827", accent: "#e8563a", shape: "checker" },
  { slug: "how-to-generate-images-with-ai-free", title: "AI Image\nGenerator", icon: "\u2728", bg: "#0f0a1a", accent: "#7c3aed", shape: "circles" },
  { slug: "how-to-convert-image-to-pdf", title: "Image\nto PDF", icon: "PDF", bg: "#1a1a2e", accent: "#ef4444", shape: "waves" },
  { slug: "best-image-format-for-instagram", title: "Best Format\nfor Instagram", icon: "\uD83D\uDCF8", bg: "#1a0a1a", accent: "#e1306c", shape: "bars" },
  { slug: "how-to-reduce-image-size-without-losing-quality", title: "Reduce Size\nKeep Quality", icon: "\u21E9", bg: "#111827", accent: "#06b6d4", shape: "grid" },
  { slug: "how-to-download-dailymotion-videos-free", title: "Download\nDailymotion", icon: "\u25B6", bg: "#0a1628", accent: "#0066dc", shape: "diagonal" },
  { slug: "how-to-use-ai-to-enhance-photos", title: "AI Photo\nEnhancer", icon: "\u2728", bg: "#1a0f1a", accent: "#d946ef", shape: "dots" },
];

function shapePatterns(shape, accent) {
  const a = accent + "15"; // 15 = ~8% opacity in hex
  const a2 = accent + "0a";
  switch (shape) {
    case "circles":
      return `<circle cx="950" cy="150" r="200" fill="${a}" /><circle cx="1100" cy="400" r="120" fill="${a2}" /><circle cx="850" cy="500" r="80" fill="${a}" />`;
    case "waves":
      return `<path d="M0 480 Q300 420 600 480 T1200 480 V630 H0Z" fill="${a}" /><path d="M0 520 Q300 460 600 520 T1200 520 V630 H0Z" fill="${a2}" />`;
    case "bars":
      return `<rect x="800" y="100" width="8" height="430" rx="4" fill="${a}" /><rect x="860" y="160" width="8" height="370" rx="4" fill="${a2}" /><rect x="920" y="200" width="8" height="330" rx="4" fill="${a}" /><rect x="980" y="140" width="8" height="390" rx="4" fill="${a2}" /><rect x="1040" y="180" width="8" height="350" rx="4" fill="${a}" /><rect x="1100" y="120" width="8" height="410" rx="4" fill="${a2}" />`;
    case "grid":
      let g = "";
      for (let x = 800; x < 1180; x += 50) for (let y = 80; y < 530; y += 50) g += `<rect x="${x}" y="${y}" width="3" height="3" rx="1" fill="${a}" />`;
      return g;
    case "diagonal":
      return `<line x1="700" y1="630" x2="1200" y2="0" stroke="${a}" stroke-width="60" /><line x1="800" y1="630" x2="1200" y2="130" stroke="${a2}" stroke-width="40" />`;
    case "dots":
      let d = "";
      for (let x = 820; x < 1180; x += 40) for (let y = 100; y < 530; y += 40) d += `<circle cx="${x}" cy="${y}" r="3" fill="${(x + y) % 80 === 0 ? accent + "30" : a}" />`;
      return d;
    case "checker":
      let c = "";
      for (let x = 800; x < 1200; x += 40) for (let y = 80; y < 560; y += 40) if ((Math.floor(x / 40) + Math.floor(y / 40)) % 2 === 0) c += `<rect x="${x}" y="${y}" width="38" height="38" rx="4" fill="${a}" />`;
      return c;
    default:
      return "";
  }
}

for (const post of POSTS) {
  const lines = post.title.split("\n");
  const textY1 = lines.length === 1 ? 340 : 280;
  const textY2 = textY1 + 90;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <rect width="1200" height="630" fill="${post.bg}" />
  ${shapePatterns(post.shape, post.accent)}
  <!-- Accent glow -->
  <defs>
    <radialGradient id="glow">
      <stop offset="0%" stop-color="${post.accent}" stop-opacity="0.15" />
      <stop offset="100%" stop-color="${post.accent}" stop-opacity="0" />
    </radialGradient>
  </defs>
  <ellipse cx="300" cy="315" rx="400" ry="300" fill="url(#glow)" />
  <!-- Icon badge -->
  <rect x="80" y="80" width="100" height="100" rx="24" fill="${post.accent}" />
  <text x="130" y="148" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="42" fill="white">${post.icon}</text>
  <!-- Title -->
  <text x="80" y="${textY1}" font-family="sans-serif" font-weight="bold" font-size="72" fill="white">${lines[0]}</text>
  ${lines[1] ? `<text x="80" y="${textY2}" font-family="sans-serif" font-weight="bold" font-size="72" fill="${post.accent}">${lines[1]}</text>` : ""}
  <!-- Divider -->
  <rect x="80" y="${textY2 + 30}" width="200" height="4" rx="2" fill="${post.accent}" opacity="0.6" />
  <!-- Subtitle -->
  <text x="80" y="${textY2 + 70}" font-family="sans-serif" font-size="24" fill="#888888">Free online tool at loveconverts.com</text>
  <!-- Brand -->
  <text x="1120" y="600" text-anchor="end" font-family="sans-serif" font-weight="bold" font-size="18" fill="#555555">LoveConverts</text>
</svg>`;

  const outPath = path.join(OUT_DIR, `${post.slug}.svg`);
  fs.writeFileSync(outPath, svg);
  console.log(`✓ ${post.slug}.svg`);
}

console.log(`\nDone! Generated ${POSTS.length} SVG images.`);
