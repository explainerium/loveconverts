/* eslint-disable */
// Generates public/og-image.png (1200x630) for LoveConverts social share.
// Run:  node scripts/generate-og-image.js

const { createCanvas } = require("canvas");
const fs = require("fs");
const path = require("path");

const W = 1200;
const H = 630;
const OUT = path.join(__dirname, "..", "public", "og-image.png");

const canvas = createCanvas(W, H);
const ctx = canvas.getContext("2d");

// ── helpers ───────────────────────────────────────────────────────────
function hexToRgba(hex, alpha) {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function ellipseGlow(cx, cy, rx, ry, colorHex, alpha) {
  // Radial gradient is circular; scale the context to make it elliptical.
  const r = Math.max(rx, ry);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(rx / r, ry / r);
  const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
  grad.addColorStop(0, hexToRgba(colorHex, alpha));
  grad.addColorStop(1, hexToRgba(colorHex, 0));
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ── 1. Background ────────────────────────────────────────────────────
ctx.fillStyle = "#111111";
ctx.fillRect(0, 0, W, H);

// ── 2. Glow effects (drawn before other elements) ────────────────────
ellipseGlow(200, 200, 400, 300, "#e8563a", 0.15);
ellipseGlow(1050, 520, 350, 250, "#e8563a", 0.10);

// ── 3. Grid pattern ──────────────────────────────────────────────────
ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
ctx.lineWidth = 0.8;
for (let x = 0; x <= W; x += 60) {
  ctx.beginPath();
  ctx.moveTo(x, 0);
  ctx.lineTo(x, H);
  ctx.stroke();
}
for (let y = 0; y <= H; y += 60) {
  ctx.beginPath();
  ctx.moveTo(0, y);
  ctx.lineTo(W, y);
  ctx.stroke();
}

// ── 4. Logo mark (top left) ──────────────────────────────────────────
ctx.fillStyle = "#e8563a";
roundRect(120, 100, 110, 110, 22);
ctx.fill();

// Heart symbol centered horizontally in the rect
ctx.fillStyle = "#ffffff";
ctx.font = "bold 62px sans-serif";
ctx.textAlign = "center";
ctx.textBaseline = "alphabetic";
ctx.fillText("\u2665", 175, 175);

// ── 5. Brand name ────────────────────────────────────────────────────
ctx.fillStyle = "#ffffff";
ctx.font = "bold 62px sans-serif";
ctx.textAlign = "left";
ctx.textBaseline = "alphabetic";
ctx.fillText("LoveConverts", 252, 168);

// ── 6. Domain ────────────────────────────────────────────────────────
ctx.fillStyle = "#888888";
ctx.font = "28px sans-serif";
ctx.fillText("loveconverts.com", 255, 205);

// ── 7. Top divider line ──────────────────────────────────────────────
ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
ctx.lineWidth = 1;
ctx.beginPath();
ctx.moveTo(120, 268);
ctx.lineTo(1080, 268);
ctx.stroke();

// ── 8. Main headline ─────────────────────────────────────────────────
ctx.fillStyle = "#ffffff";
ctx.font = "bold 74px sans-serif";
ctx.textAlign = "left";
ctx.textBaseline = "alphabetic";
ctx.fillText("Free Image Tools &", 120, 358);

ctx.fillStyle = "#e8563a";
ctx.fillText("Video Downloader", 120, 448);

// ── 9. Subtitle ──────────────────────────────────────────────────────
ctx.fillStyle = "#aaaaaa";
ctx.font = "32px sans-serif";
ctx.fillText("Convert, compress, resize and crop images.", 120, 496);
ctx.fillText("Download from TikTok, Instagram, YouTube and more.", 120, 536);

// ── 10. Bottom divider line ──────────────────────────────────────────
ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
ctx.lineWidth = 1;
ctx.beginPath();
ctx.moveTo(120, 572);
ctx.lineTo(1080, 572);
ctx.stroke();

// ── 11. Bottom pills ─────────────────────────────────────────────────
function drawPill(x, y, w, h, r, fill, stroke, lineWidth) {
  ctx.fillStyle = fill;
  roundRect(x, y, w, h, r);
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    roundRect(x, y, w, h, r);
    ctx.stroke();
  }
}

// Pill 1 — 15+ Tools (accent stroke)
drawPill(120, 592, 200, 50, 25, "#1f1f1f", "#e8563a", 1.5);
ctx.fillStyle = "#e8563a";
ctx.font = "bold 24px sans-serif";
ctx.textAlign = "center";
ctx.textBaseline = "alphabetic";
ctx.fillText("15+ Tools", 220, 624);

// Pill 2 — No Signup
drawPill(332, 592, 188, 50, 25, "#1f1f1f", "#333333", 1);
ctx.fillStyle = "#aaaaaa";
ctx.font = "24px sans-serif";
ctx.fillText("No Signup", 426, 624);

// Pill 3 — Files Never Stored
drawPill(532, 592, 270, 50, 25, "#1f1f1f", "#333333", 1);
ctx.fillText("Files Never Stored", 667, 624);

// Pill 4 — Free Forever
drawPill(814, 592, 210, 50, 25, "#1f1f1f", "#333333", 1);
ctx.fillText("Free Forever", 919, 624);

// ── 12. Right-side format badges ─────────────────────────────────────
function drawBadge(x, y, fill, stroke) {
  ctx.fillStyle = fill;
  roundRect(x, y, 118, 56, 12);
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1;
    roundRect(x, y, 118, 56, 12);
    ctx.stroke();
  }
}

ctx.font = "bold 28px sans-serif";
ctx.textAlign = "center";
ctx.textBaseline = "alphabetic";

// Row 1 — JPG / PNG
drawBadge(878, 298, "#1f1f1f", "#333333");
ctx.fillStyle = "#888888";
ctx.fillText("JPG", 937, 334);

drawBadge(1006, 298, "#1f1f1f", "#333333");
ctx.fillStyle = "#888888";
ctx.fillText("PNG", 1065, 334);

// Row 2 — WebP (accent) / AVIF
drawBadge(878, 366, "#e8563a", null);
ctx.fillStyle = "#ffffff";
ctx.fillText("WebP", 937, 402);

drawBadge(1006, 366, "#1f1f1f", "#333333");
ctx.fillStyle = "#888888";
ctx.fillText("AVIF", 1065, 402);

// Row 3 — GIF / MP4
drawBadge(878, 434, "#1f1f1f", "#333333");
ctx.fillStyle = "#888888";
ctx.fillText("GIF", 937, 470);

drawBadge(1006, 434, "#1f1f1f", "#333333");
ctx.fillStyle = "#888888";
ctx.fillText("MP4", 1065, 470);

// ── Export ───────────────────────────────────────────────────────────
const buffer = canvas.toBuffer("image/png");
fs.writeFileSync(OUT, buffer);
console.log(`✓ Wrote ${OUT} (${buffer.length.toLocaleString()} bytes)`);
