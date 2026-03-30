import type { NextRequest } from "next/server";
import sharp from "sharp";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Advanced AI Image Enhancer — Kid-Friendly Edition
 *
 * ALL features are FREE — no rate limits, no pro gates.
 *
 * 9-step base pipeline + creative filters:
 *   1. Noise reduction (median + blur)
 *   2. Upscale (Lanczos3 — 2x / 4x)
 *   3. Multi-pass sharpening (fine detail + clarity)
 *   4. Clarity (wide-radius midtone contrast)
 *   5. Brightness & Contrast
 *   6. Shadow & Highlight recovery
 *   7. Vibrance / Saturation
 *   8. Color temperature (warm/cool)
 *   9. Creative filters (cartoon, sketch, glow, vintage, pop art, dreamy, neon)
 */

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function parseNum(val: string | null, def: number): number {
  if (!val) return def;
  const n = parseFloat(val);
  return isNaN(n) ? def : n;
}

// Mode presets — fun kid-friendly names map to these on the backend
const MODE_PRESETS: Record<string, Record<string, number>> = {
  auto:      { denoise: 20, sharpen: 55, clarity: 40, vibrance: 30, contrast: 15, brightness: 5 },
  upscale:   { sharpen: 55, clarity: 20, denoise: 15 },
  portrait:  { denoise: 30, sharpen: 35, clarity: 20, vibrance: 15, brightness: 5, warmth: 5 },
  denoise:   { denoise: 70, sharpen: 20, clarity: 10 },
  sharpen:   { sharpen: 65, clarity: 40 },
  hdr:       { clarity: 60, contrast: 25, shadows: 30, highlights: -20, vibrance: 30, sharpen: 25 },
  color:     { vibrance: 50, contrast: 15, brightness: 5, warmth: 10 },
  lowlight:  { brightness: 20, shadows: 40, denoise: 50, sharpen: 30, contrast: 15, vibrance: 10 },
  cartoon:   { sharpen: 80, clarity: 70, contrast: 30, vibrance: 60, denoise: 40 },
  sketch:    { sharpen: 90, clarity: 50, contrast: 40 },
  glow:      { brightness: 15, contrast: -10, vibrance: 20, warmth: 15 },
  vintage:   { contrast: 20, vibrance: -10, warmth: 25, brightness: -5 },
  popart:    { contrast: 40, vibrance: 80, sharpen: 50, clarity: 30 },
  dreamy:    { brightness: 10, contrast: -15, vibrance: 15, warmth: 10 },
  neon:      { contrast: 35, vibrance: 90, sharpen: 40, clarity: 50, brightness: 5 },
  superhero: { sharpen: 70, clarity: 60, contrast: 30, vibrance: 40, hdr_effect: 1 },
  custom:    {},
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const file = formData.get("file") as File | null;
    if (!file) return Response.json({ error: "No file provided" }, { status: 400 });

    // No rate limits — all features free for kids!
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > 50) {
      return Response.json({ error: "File too large! Max 50 MB." }, { status: 400 });
    }

    const mode = (formData.get("mode") as string) || "auto";
    const preset = MODE_PRESETS[mode] || {};
    const isPreview = formData.get("preview") === "true";

    // Parse all parameters (preset values used as defaults)
    const scale      = clamp(parseNum(formData.get("scale") as string,      mode === "upscale" ? 2 : 1), 1, 4);
    const denoise    = clamp(parseNum(formData.get("denoise") as string,    preset.denoise ?? 0), 0, 100);
    const sharpenAmt = clamp(parseNum(formData.get("sharpen") as string,    preset.sharpen ?? 0), 0, 100);
    const clarity    = clamp(parseNum(formData.get("clarity") as string,    preset.clarity ?? 0), 0, 100);
    const vibrance   = clamp(parseNum(formData.get("vibrance") as string,   preset.vibrance ?? 0), 0, 100);
    const brightness = clamp(parseNum(formData.get("brightness") as string, preset.brightness ?? 0), -50, 50);
    const contrast   = clamp(parseNum(formData.get("contrast") as string,   preset.contrast ?? 0), -50, 50);
    const highlights = clamp(parseNum(formData.get("highlights") as string, preset.highlights ?? 0), -50, 50);
    const shadows    = clamp(parseNum(formData.get("shadows") as string,    preset.shadows ?? 0), -50, 50);
    const warmth     = clamp(parseNum(formData.get("warmth") as string,     preset.warmth ?? 0), -50, 50);
    const blur       = clamp(parseNum(formData.get("blur") as string,       0), 0, 30);
    const vignette   = clamp(parseNum(formData.get("vignette") as string,   0), 0, 100);

    const outputFmt = ((formData.get("outputFormat") as string) || "jpg").toLowerCase();
    const quality   = clamp(parseNum(formData.get("quality") as string, 92), 1, 100);

    const inputBuffer = Buffer.from(await file.arrayBuffer());
    const metadata = await sharp(inputBuffer).metadata();
    const origW = metadata.width || 1;
    const origH = metadata.height || 1;

    // Preview runs at reduced resolution for speed
    const previewMaxDim = 1200;
    const previewScale = isPreview ? Math.min(1, previewMaxDim / Math.max(origW, origH)) : 1;

    let pipeline = sharp(inputBuffer);

    // ─── Step 0: Preview resize ─────────────────────────────────────────────
    if (isPreview && previewScale < 1) {
      pipeline = pipeline.resize(
        Math.round(origW * previewScale),
        Math.round(origH * previewScale),
        { kernel: "lanczos3" }
      );
    }

    // ─── Step 1: Noise reduction ────────────────────────────────────────────
    if (denoise > 0) {
      const sigma = 0.3 + (denoise / 100) * 2.5;
      pipeline = pipeline.median(denoise > 50 ? 5 : 3);
      if (denoise > 30) {
        pipeline = pipeline.blur(sigma);
      }
    }

    // ─── Step 2: Upscale (Lanczos3 resampling) ─────────────────────────────
    if (scale > 1 && !isPreview) {
      const newW = Math.min(origW * scale, 8192);
      const newH = Math.min(origH * scale, 8192);
      pipeline = pipeline.resize(Math.round(newW), Math.round(newH), {
        kernel: "lanczos3",
        fastShrinkOnLoad: false,
      });
    }

    // ─── Step 3: Multi-pass sharpening ──────────────────────────────────────
    if (sharpenAmt > 0) {
      const s = sharpenAmt / 100;
      // Fine detail pass
      pipeline = pipeline.sharpen({
        sigma: 0.5 + s * 0.5,
        m1: 0.5 + s * 1.5,
        m2: 1.0 + s * 3.0,
      });
      // Clarity pass for strong sharpening
      if (sharpenAmt > 40) {
        pipeline = pipeline.sharpen({
          sigma: 1.5 + s * 1.5,
          m1: 0.3 + s * 0.5,
          m2: 0.5 + s * 1.0,
        });
      }
    }

    // ─── Step 4: Clarity (midtone local contrast) ───────────────────────────
    if (clarity > 0) {
      const c = clarity / 100;
      pipeline = pipeline.sharpen({
        sigma: 5 + c * 15,
        m1: c * 1.5,
        m2: c * 0.5,
      });
    }

    // ─── Step 5: Brightness & Contrast ──────────────────────────────────────
    if (brightness !== 0) {
      pipeline = pipeline.modulate({
        brightness: Math.max(0.1, 1 + brightness / 100),
      });
    }
    if (contrast !== 0) {
      const a = Math.max(0.01, 1 + contrast / 50);
      const b = 128 * (1 - a);
      pipeline = pipeline.linear(a, b);
    }

    // ─── Step 6: Shadow & Highlight recovery ────────────────────────────────
    if (shadows > 0) {
      pipeline = pipeline.gamma(Math.max(0.5, 1 - (shadows / 100) * 0.4));
    } else if (shadows < 0) {
      pipeline = pipeline.gamma(Math.min(2.5, 1 + (Math.abs(shadows) / 100) * 0.5));
    }
    if (highlights !== 0) {
      const a = 1 - (highlights / 100) * 0.3;
      pipeline = pipeline.linear(Math.max(0.5, a), highlights > 0 ? 10 : -10);
    }

    // ─── Step 7: Vibrance / Saturation ──────────────────────────────────────
    if (vibrance !== 0) {
      pipeline = pipeline.modulate({
        saturation: Math.max(0, 1 + (vibrance / 100) * 0.8),
      });
    }

    // ─── Step 8: Color temperature ──────────────────────────────────────────
    if (warmth > 0) {
      const w = warmth / 50;
      pipeline = pipeline.tint({
        r: Math.round(255 + w * 15),
        g: Math.round(220 + w * 10),
        b: Math.round(180 - w * 20),
      });
    } else if (warmth < 0) {
      const w = Math.abs(warmth) / 50;
      pipeline = pipeline.tint({
        r: Math.round(180 - w * 20),
        g: Math.round(210 + w * 5),
        b: Math.round(255 + w * 15),
      });
    }

    // ─── Step 9: Creative filters ───────────────────────────────────────────

    // Sketch: convert to grayscale + aggressive edge sharpening
    if (mode === "sketch") {
      pipeline = pipeline.grayscale();
      pipeline = pipeline.sharpen({ sigma: 2, m1: 3, m2: 5 });
      pipeline = pipeline.linear(1.8, -100); // high contrast B&W
    }

    // Vintage: desaturate + warm tint + slight grain via noise
    if (mode === "vintage") {
      pipeline = pipeline.modulate({ saturation: 0.6 });
      pipeline = pipeline.tint({ r: 240, g: 210, b: 170 });
      pipeline = pipeline.gamma(1.2);
    }

    // Glow / Dreamy: soft blur overlay effect (brighten + soften)
    if (mode === "glow" || mode === "dreamy") {
      pipeline = pipeline.blur(1.5);
      pipeline = pipeline.modulate({ brightness: 1.1 });
    }

    // Neon: extreme saturation + contrast
    if (mode === "neon") {
      pipeline = pipeline.modulate({ saturation: 2.2 });
      pipeline = pipeline.linear(1.5, -60);
    }

    // Pop Art: extreme saturation + posterize via reduced color depth
    if (mode === "popart") {
      pipeline = pipeline.modulate({ saturation: 2.5 });
      pipeline = pipeline.linear(1.8, -80);
    }

    // Cartoon: edge enhancement + posterization + vibrance
    if (mode === "cartoon") {
      pipeline = pipeline.sharpen({ sigma: 3, m1: 4, m2: 6 });
      pipeline = pipeline.modulate({ saturation: 1.6 });
      pipeline = pipeline.linear(1.4, -50);
    }

    // Superhero: HDR-like dramatic look
    if (mode === "superhero") {
      pipeline = pipeline.sharpen({ sigma: 4, m1: 2, m2: 4 });
      pipeline = pipeline.modulate({ saturation: 1.4, brightness: 1.05 });
      pipeline = pipeline.gamma(0.85);
    }

    // Background blur
    if (blur > 0) {
      pipeline = pipeline.blur(Math.max(0.3, blur * 0.5));
    }

    // Vignette: darken edges using compositing
    if (vignette > 0 && !isPreview) {
      const imgMeta = await sharp(inputBuffer).metadata();
      const w = scale > 1 ? Math.round(origW * scale) : (imgMeta.width || origW);
      const h = scale > 1 ? Math.round(origH * scale) : (imgMeta.height || origH);
      const strength = Math.round((vignette / 100) * 120);

      // Create a radial gradient vignette overlay
      const svgVignette = Buffer.from(`
        <svg width="${w}" height="${h}">
          <defs>
            <radialGradient id="v" cx="50%" cy="50%" r="70%">
              <stop offset="50%" stop-color="black" stop-opacity="0"/>
              <stop offset="100%" stop-color="black" stop-opacity="${strength / 255}"/>
            </radialGradient>
          </defs>
          <rect width="${w}" height="${h}" fill="url(#v)"/>
        </svg>
      `);

      const vignetteOverlay = await sharp(svgVignette).resize(w, h).png().toBuffer();
      pipeline = pipeline.composite([{ input: vignetteOverlay, blend: "multiply" }]);
    }

    // ─── Output ─────────────────────────────────────────────────────────────
    let outputBuffer: Buffer;
    let contentType: string;
    let ext: string;

    switch (outputFmt) {
      case "png":
        outputBuffer = await pipeline.png().toBuffer();
        contentType = "image/png"; ext = "png"; break;
      case "webp":
        outputBuffer = await pipeline.webp({ quality }).toBuffer();
        contentType = "image/webp"; ext = "webp"; break;
      default:
        outputBuffer = await pipeline.jpeg({ quality, mozjpeg: true }).toBuffer();
        contentType = "image/jpeg"; ext = "jpg"; break;
    }

    const base = file.name.replace(/\.[^/.]+$/, "") || "enhanced";

    const body = outputBuffer.buffer.slice(
      outputBuffer.byteOffset,
      outputBuffer.byteOffset + outputBuffer.byteLength
    ) as ArrayBuffer;

    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${base}-enhanced.${ext}"`,
        "Content-Length": outputBuffer.byteLength.toString(),
        "Cache-Control": "no-store",
        "X-Original-Size": file.size.toString(),
        "X-Enhanced-Size": outputBuffer.byteLength.toString(),
        "X-Scale": scale.toString(),
        "X-Mode": mode,
      },
    });
  } catch (err) {
    console.error("Enhance error:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Enhancement failed" },
      { status: 500 }
    );
  }
}
