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

    // Rate limiting for logged-in users
    if (session?.user?.id) {
      const check = checkAndIncrementLimit(session.user.id, fileSizeMB);
      if (!check.allowed) {
        return Response.json(
          { error: check.reason, code: "RATE_LIMIT" },
          { status: 429 }
        );
      }
    } else {
      // Anonymous: enforce free max file size (10 MB)
      if (fileSizeMB > 10) {
        return Response.json({ error: "File exceeds 10 MB. Sign up for free to compress larger files." }, { status: 400 });
      }
    }

    const quality       = Math.min(100, Math.max(1, parseInt((formData.get("quality") as string) || "80")));
    const keepFormat    = formData.get("keepFormat") !== "false";
    const targetFormat  = keepFormat
      ? (file.type.split("/")[1] || "jpeg")
      : ((formData.get("targetFormat") as string) || "jpeg");

    const buffer = Buffer.from(await file.arrayBuffer());
    let pipeline = sharp(buffer);

    let outputBuffer: Buffer;
    let contentType: string;
    let ext: string;
    const fmt = targetFormat.toLowerCase().replace("jpeg", "jpg");

    switch (fmt) {
      case "jpg":
      case "jpeg":
        outputBuffer = await pipeline.jpeg({ quality, mozjpeg: true }).toBuffer();
        contentType = "image/jpeg"; ext = "jpg"; break;
      case "png":
        outputBuffer = await pipeline.png({ compressionLevel: Math.floor((100 - quality) / 11) }).toBuffer();
        contentType = "image/png"; ext = "png"; break;
      case "webp":
        outputBuffer = await pipeline.webp({ quality }).toBuffer();
        contentType = "image/webp"; ext = "webp"; break;
      case "avif":
        outputBuffer = await pipeline.avif({ quality }).toBuffer();
        contentType = "image/avif"; ext = "avif"; break;
      default:
        outputBuffer = await pipeline.jpeg({ quality, mozjpeg: true }).toBuffer();
        contentType = "image/jpeg"; ext = "jpg";
    }

    const base = (file.name.replace(/\.[^/.]+$/, "") || "compressed").replace(/[^\x20-\x7E]/g, "").replace(/\s+/g, "_") || "compressed";

    if (session?.user?.id) {
      recordConversion({
        userId: session.user.id,
        filename: file.name,
        fromFormat: file.type.split("/")[1] || "unknown",
        toFormat: ext,
        tool: "compress",
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
        "Content-Disposition": `attachment; filename="${base}-compressed.${ext}"`,
        "Content-Length": outputBuffer.byteLength.toString(),
        "Cache-Control": "no-store",
        "X-Original-Size": file.size.toString(),
        "X-Compressed-Size": outputBuffer.byteLength.toString(),
      },
    });
  } catch (err) {
    console.error("Compress error:", err);
    return Response.json({ error: err instanceof Error ? err.message : "Compression failed" }, { status: 500 });
  }
}
