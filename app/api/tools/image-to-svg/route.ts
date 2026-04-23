import sharp from "sharp";
import potrace from "potrace";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 120;

const ACCEPTED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
  "image/bmp",
  "image/tiff",
]);

function traceBW(
  buf: Buffer,
  threshold: number,
  detail: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    potrace.trace(
      buf,
      {
        threshold,
        turdSize: detail,
        optTolerance: 0.2,
        optCurve: true,
      },
      (err, svg) => (err ? reject(err) : resolve(svg))
    );
  });
}

function traceColor(
  buf: Buffer,
  colors: number,
  detail: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    potrace.posterize(
      buf,
      {
        steps: colors,
        turdSize: detail,
        fillStrategy: "dominant",
        rangeDistribution: "auto",
        optTolerance: 0.2,
        optCurve: true,
      },
      (err, svg) => (err ? reject(err) : resolve(svg))
    );
  });
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }
    if (file.size > 20 * 1024 * 1024) {
      return Response.json(
        { error: "File exceeds 20 MB limit." },
        { status: 400 }
      );
    }
    if (!ACCEPTED.has(file.type)) {
      return Response.json(
        { error: "Unsupported format. Use JPG, PNG, WebP, AVIF, GIF, BMP, or TIFF." },
        { status: 400 }
      );
    }

    const mode = (formData.get("mode") as string) || "bw";
    const threshold = Math.min(
      255,
      Math.max(0, parseInt(formData.get("threshold") as string) || 128)
    );
    const colors = Math.min(
      16,
      Math.max(2, parseInt(formData.get("colors") as string) || 4)
    );
    const detail = Math.min(
      100,
      Math.max(1, parseInt(formData.get("detail") as string) || 4)
    );

    const raw = Buffer.from(await file.arrayBuffer());

    // Color tracing is O(pixels * colors) — use smaller canvas to avoid
    // memory exhaustion on the 512 MB VPS. B&W is much lighter.
    const maxDim = mode === "color" ? 1000 : 1500;

    const pngBuf = await sharp(raw)
      .resize(maxDim, maxDim, { fit: "inside", withoutEnlargement: true })
      .png()
      .toBuffer();

    console.log(
      `[image-to-svg] mode=${mode} size=${(pngBuf.length / 1024).toFixed(0)}KB colors=${colors} detail=${detail}`
    );

    let svg: string;
    if (mode === "color") {
      svg = await traceColor(pngBuf, colors, detail);
    } else {
      svg = await traceBW(pngBuf, threshold, detail);
    }

    return Response.json({ svg });
  } catch (err) {
    console.error("[image-to-svg] error:", err);
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json(
      {
        error: msg.includes("memory") || msg.includes("ENOMEM")
          ? "Image is too complex for color tracing. Try Black & White mode or fewer colors."
          : "Conversion failed. Please try a different image or simpler settings.",
      },
      { status: 500 }
    );
  }
}
