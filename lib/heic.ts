import sharp from "sharp";

const HEIC_MIMES = new Set(["image/heic", "image/heif", "image/heic-sequence", "image/heif-sequence"]);
const HEIC_EXT = /\.(heic|heif)$/i;

export function isHeic(file: { name?: string; type?: string }): boolean {
  if (file.type && HEIC_MIMES.has(file.type)) return true;
  if (file.name && HEIC_EXT.test(file.name)) return true;
  return false;
}

/**
 * Decode an image buffer to JPEG. For HEIC inputs, try sharp first (works
 * when libheif is available system-wide), then fall back to the pure-JS
 * `heic-convert` package so the route still works on VPS images that don't
 * ship libheif by default.
 */
export async function bufferToJpeg(
  buffer: Buffer,
  opts: { quality: number; background?: string }
): Promise<Buffer> {
  const { quality, background = "#ffffff" } = opts;

  try {
    return await sharp(buffer)
      .flatten({ background })
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    // Sharp without libheif throws "compiled without HEIF support" /
    // "bad seek" / "Input file contains unsupported image format"
    const looksLikeHeic =
      msg.includes("HEIF") ||
      msg.includes("heif") ||
      msg.includes("unsupported image format") ||
      msg.includes("bad seek");

    if (!looksLikeHeic) throw err;

    // Fallback: pure-JS HEIC decoder
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const heicConvert = require("heic-convert");
    const jpegArrayBuffer = await heicConvert({
      buffer,
      format: "JPEG",
      quality: Math.min(1, Math.max(0, quality / 100)),
    });
    // Re-run through sharp to honor the requested quality / mozjpeg settings
    return sharp(Buffer.from(jpegArrayBuffer))
      .flatten({ background })
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();
  }
}
