import type { NextRequest } from "next/server";
import sharp from "sharp";
import { auth } from "@/auth";
import { checkAndIncrementLimit, recordConversion } from "@/lib/limits";

export const dynamic = "force-dynamic";
export const runtime  = "nodejs";

export async function POST(request: NextRequest) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let session: any = null;
    try { session = await auth(); } catch { /* auth failed, continue as anonymous */ }
    const formData = await request.formData();

    const file = formData.get("file") as File | null;
    if (!file) return Response.json({ error: "No file provided" }, { status: 400 });

    const fileSizeMB = file.size / (1024 * 1024);

    // Only check limit when the "save" action is requested (not on live preview)
    const isPreview = formData.get("preview") === "true";
    if (!isPreview && session?.user?.id) {
      const check = checkAndIncrementLimit(session.user.id, fileSizeMB);
      if (!check.allowed) {
        return Response.json({ error: check.reason, code: "RATE_LIMIT" }, { status: 429 });
      }
    } else if (!isPreview && fileSizeMB > 10) {
      return Response.json({ error: "File exceeds 10 MB" }, { status: 400 });
    }

    // ── Parse all adjustment parameters ─────────────────────────────────────
    const brightness = parseFloat((formData.get("brightness") as string) || "0");
    const contrast   = parseFloat((formData.get("contrast")   as string) || "0");
    const saturation = parseFloat((formData.get("saturation") as string) || "0");
    const hue        = parseFloat((formData.get("hue")        as string) || "0");
    const sharpness  = parseFloat((formData.get("sharpness")  as string) || "0");
    const blur       = parseFloat((formData.get("blur")       as string) || "0");
    const grayscale  = formData.get("grayscale") === "true";
    const sepia      = formData.get("sepia")     === "true";
    const rotateRaw  = parseInt((formData.get("rotate") as string) || "0");
    const rotateDeg  = [0, 90, 180, 270].includes(rotateRaw) ? rotateRaw : 0;
    const flip       = formData.get("flip") === "true";
    const flop       = formData.get("flop") === "true";

    const outputFmt = ((formData.get("outputFormat") as string) || "jpg").toLowerCase();
    const quality   = Math.min(100, Math.max(1, parseInt((formData.get("quality") as string) || "90")));

    const buffer = Buffer.from(await file.arrayBuffer());
    let pipeline = sharp(buffer);

    // Rotate first (before other operations)
    if (rotateDeg !== 0) pipeline = pipeline.rotate(rotateDeg);
    if (flip)  pipeline = pipeline.flip();
    if (flop)  pipeline = pipeline.flop();

    // Modulate (brightness, saturation, hue)
    const bMult  = Math.max(0.01, 1 + brightness / 100);
    const sMult  = Math.max(0.0,  1 + saturation / 100);
    if (brightness !== 0 || saturation !== 0 || hue !== 0) {
      pipeline = pipeline.modulate({
        brightness: bMult,
        saturation: sMult,
        hue: hue,
      });
    }

    // Contrast via linear: output = a*input + b (keeps 128 fixed)
    if (contrast !== 0) {
      const a = Math.max(0.01, 1 + contrast / 100);
      const b = 128 * (1 - a);
      pipeline = pipeline.linear(a, b);
    }

    // Sharpen
    if (sharpness > 0) {
      pipeline = pipeline.sharpen(sharpness * 0.5);
    }

    // Blur
    if (blur > 0) {
      pipeline = pipeline.blur(Math.max(0.3, blur * 0.5));
    }

    // Grayscale
    if (grayscale) pipeline = pipeline.grayscale();

    // Sepia (grayscale + warm tint)
    if (sepia && !grayscale) {
      pipeline = pipeline.grayscale().tint({ r: 112, g: 66, b: 20 });
    }

    let outputBuffer: Buffer;
    let contentType: string;
    let ext: string;

    switch (outputFmt) {
      case "jpg":
      case "jpeg":
        outputBuffer = await pipeline.jpeg({ quality }).toBuffer();
        contentType = "image/jpeg"; ext = "jpg"; break;
      case "png":
        outputBuffer = await pipeline.png().toBuffer();
        contentType = "image/png"; ext = "png"; break;
      case "webp":
        outputBuffer = await pipeline.webp({ quality }).toBuffer();
        contentType = "image/webp"; ext = "webp"; break;
      case "avif":
        outputBuffer = await pipeline.avif({ quality }).toBuffer();
        contentType = "image/avif"; ext = "avif"; break;
      default:
        outputBuffer = await pipeline.jpeg({ quality }).toBuffer();
        contentType = "image/jpeg"; ext = "jpg";
    }

    const base = file.name.replace(/\.[^/.]+$/, "") || "edited";

    if (!isPreview && session?.user?.id) {
      recordConversion({
        userId: session.user.id,
        filename: file.name,
        fromFormat: file.type.split("/")[1] || "unknown",
        toFormat: ext,
        tool: "photo-editor",
        originalSize: file.size,
        convertedSize: outputBuffer.byteLength,
      });
    }

    const body = outputBuffer.buffer.slice(
      outputBuffer.byteOffset,
      outputBuffer.byteOffset + outputBuffer.byteLength
    ) as ArrayBuffer;

    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${base}-edited.${ext}"`,
        "Content-Length": outputBuffer.byteLength.toString(),
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("Photo editor error:", err);
    return Response.json({ error: err instanceof Error ? err.message : "Edit failed" }, { status: 500 });
  }
}
