import type { NextRequest } from "next/server";
import sharp from "sharp";
import { auth } from "@/auth";
import { checkAndIncrementLimit, recordConversion } from "@/lib/limits";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const FREE_MAX_FILE_SIZE = 10 * 1024 * 1024;  // 10 MB for anonymous / free
const PRO_MAX_FILE_SIZE  = 50 * 1024 * 1024;  // 50 MB for pro

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/bmp",
  "image/tiff",
  "image/avif",
  "image/svg+xml",
  "image/x-icon",
  "image/vnd.microsoft.icon",
]);

export async function POST(request: NextRequest) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let session: any = null;
    try { session = await auth(); } catch { /* auth failed, continue as anonymous */ }
    const formData = await request.formData();

    const file = formData.get("file") as File | null;
    const targetFormat = (
      formData.get("targetFormat") as string | null
    )?.toLowerCase();

    // ── Validation ───────────────────────────────────────────────────────────
    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }
    if (!targetFormat) {
      return Response.json({ error: "No target format specified" }, { status: 400 });
    }
    if (!ALLOWED_MIME.has(file.type) && !file.type.startsWith("image/")) {
      return Response.json({ error: "Unsupported file type" }, { status: 400 });
    }

    const fileSizeMB = file.size / (1024 * 1024);

    if (session?.user?.id) {
      // Logged-in user — check daily limit and file size
      const check = checkAndIncrementLimit(session.user.id, fileSizeMB);
      if (!check.allowed) {
        return Response.json({ error: check.reason, code: "RATE_LIMIT" }, { status: 429 });
      }
    } else {
      // Anonymous — enforce 10 MB cap, no daily tracking
      if (file.size > FREE_MAX_FILE_SIZE) {
        return Response.json(
          { error: "File exceeds 10 MB. Sign up free to convert larger files.", code: "FILE_TOO_LARGE" },
          { status: 400 }
        );
      }
    }

    // Pro users may upload up to 50 MB
    const maxSize = session?.user?.plan === "pro" ? PRO_MAX_FILE_SIZE : FREE_MAX_FILE_SIZE;
    if (file.size > maxSize) {
      return Response.json(
        { error: `File exceeds ${maxSize / (1024 * 1024)} MB limit for your plan.`, code: "FILE_TOO_LARGE" },
        { status: 400 }
      );
    }

    // ── Parse options ────────────────────────────────────────────────────────
    const quality = Math.min(
      100,
      Math.max(1, parseInt((formData.get("quality") as string) || "85"))
    );
    const widthStr  = formData.get("width")  as string | null;
    const heightStr = formData.get("height") as string | null;
    const stripMetadata      = formData.get("stripMetadata")      !== "false";
    const lockAspectRatio    = formData.get("lockAspectRatio")    !== "false";
    const grayscale          = formData.get("grayscale")          === "true";
    const flip               = formData.get("flip")               === "true";
    const flop               = formData.get("flop")               === "true";
    const withoutEnlargement = formData.get("withoutEnlargement") !== "false";

    const rotateRaw = parseInt((formData.get("rotate") as string) || "0");
    const rotateDeg = [0, 90, 180, 270].includes(rotateRaw) ? rotateRaw : 0;

    type FitType = "contain" | "cover" | "fill" | "inside" | "outside";
    const fitRaw = (formData.get("fit") as string) || "inside";
    const validFits: FitType[] = ["contain", "cover", "fill", "inside", "outside"];
    const fit: FitType = validFits.includes(fitRaw as FitType)
      ? (fitRaw as FitType)
      : "inside";

    // ── Build pipeline ───────────────────────────────────────────────────────
    const arrayBuffer = await file.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);

    let pipeline = sharp(inputBuffer);

    if (rotateDeg !== 0) pipeline = pipeline.rotate(rotateDeg);
    if (flip) pipeline = pipeline.flip();
    if (flop) pipeline = pipeline.flop();

    const width  = widthStr  ? parseInt(widthStr)  : undefined;
    const height = heightStr ? parseInt(heightStr) : undefined;

    if (width || height) {
      pipeline = pipeline.resize(width ?? null, height ?? null, {
        fit: lockAspectRatio ? "inside" : fit,
        withoutEnlargement,
      });
    }

    if (grayscale) pipeline = pipeline.grayscale();
    if (!stripMetadata) pipeline = pipeline.withMetadata();

    // ── Format output ────────────────────────────────────────────────────────
    let outputBuffer: Buffer;
    let contentType: string;
    let extension: string;

    switch (targetFormat) {
      case "jpg":
      case "jpeg":
        outputBuffer = await pipeline.jpeg({ quality }).toBuffer();
        contentType  = "image/jpeg";
        extension    = "jpg";
        break;

      case "png":
        outputBuffer = await pipeline.png({ compressionLevel: 9 }).toBuffer();
        contentType  = "image/png";
        extension    = "png";
        break;

      case "webp":
        outputBuffer = await pipeline.webp({ quality }).toBuffer();
        contentType  = "image/webp";
        extension    = "webp";
        break;

      case "avif":
        outputBuffer = await pipeline.avif({ quality }).toBuffer();
        contentType  = "image/avif";
        extension    = "avif";
        break;

      case "gif":
        outputBuffer = await pipeline.gif().toBuffer();
        contentType  = "image/gif";
        extension    = "gif";
        break;

      case "tiff":
        outputBuffer = await pipeline.tiff().toBuffer();
        contentType  = "image/tiff";
        extension    = "tiff";
        break;

      case "ico":
        outputBuffer = await pipeline
          .resize(256, 256, {
            fit: "contain",
            background: { r: 0, g: 0, b: 0, alpha: 0 },
          })
          .png()
          .toBuffer();
        contentType = "image/x-icon";
        extension   = "ico";
        break;

      default:
        return Response.json(
          { error: `Unsupported format: ${targetFormat}` },
          { status: 400 }
        );
    }

    const baseName = file.name.replace(/\.[^/.]+$/, "") || "converted";

    // Record conversion in DB for logged-in users
    if (session?.user?.id) {
      recordConversion({
        userId: session.user.id,
        filename: file.name,
        fromFormat: file.type.split("/")[1]?.replace("jpeg", "jpg") || "unknown",
        toFormat: extension,
        tool: "converter",
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
        "Content-Disposition": `attachment; filename="${baseName}.${extension}"`,
        "Content-Length": outputBuffer.byteLength.toString(),
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("Conversion error:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
