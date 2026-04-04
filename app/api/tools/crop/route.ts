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
    if (session?.user?.id) {
      const check = checkAndIncrementLimit(session.user.id, fileSizeMB);
      if (!check.allowed) {
        return Response.json({ error: check.reason, code: "RATE_LIMIT" }, { status: 429 });
      }
    } else if (fileSizeMB > 10) {
      return Response.json({ error: "File exceeds 10 MB" }, { status: 400 });
    }

    const left   = parseInt((formData.get("left")   as string) || "0");
    const top    = parseInt((formData.get("top")    as string) || "0");
    const width  = parseInt((formData.get("width")  as string) || "0");
    const height = parseInt((formData.get("height") as string) || "0");

    if (width <= 0 || height <= 0) {
      return Response.json({ error: "Valid crop dimensions required" }, { status: 400 });
    }

    const outputFmt = ((formData.get("outputFormat") as string) || "").toLowerCase() ||
      file.type.split("/")[1]?.replace("jpeg", "jpg") || "jpg";

    const buffer = Buffer.from(await file.arrayBuffer());
    let pipeline = sharp(buffer).extract({
      left:   Math.max(0, left),
      top:    Math.max(0, top),
      width:  Math.max(1, width),
      height: Math.max(1, height),
    });

    let outputBuffer: Buffer;
    let contentType: string;
    let ext: string;

    switch (outputFmt) {
      case "jpg":
      case "jpeg":
        outputBuffer = await pipeline.jpeg({ quality: 92 }).toBuffer();
        contentType = "image/jpeg"; ext = "jpg"; break;
      case "png":
        outputBuffer = await pipeline.png().toBuffer();
        contentType = "image/png"; ext = "png"; break;
      case "webp":
        outputBuffer = await pipeline.webp({ quality: 90 }).toBuffer();
        contentType = "image/webp"; ext = "webp"; break;
      default:
        outputBuffer = await pipeline.jpeg({ quality: 92 }).toBuffer();
        contentType = "image/jpeg"; ext = "jpg";
    }

    const base = (file.name.replace(/\.[^/.]+$/, "") || "cropped").replace(/[^\x20-\x7E]/g, "").replace(/\s+/g, "_") || "cropped";

    if (session?.user?.id) {
      recordConversion({
        userId: session.user.id,
        filename: file.name,
        fromFormat: file.type.split("/")[1] || "unknown",
        toFormat: ext,
        tool: "crop",
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
        "Content-Disposition": `attachment; filename="${base}-cropped.${ext}"`,
        "Content-Length": outputBuffer.byteLength.toString(),
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("Crop error:", err);
    return Response.json({ error: err instanceof Error ? err.message : "Crop failed" }, { status: 500 });
  }
}
