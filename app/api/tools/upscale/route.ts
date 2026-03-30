import type { NextRequest } from "next/server";
import sharp from "sharp";
import { auth } from "@/auth";
import { checkAndIncrementLimit, recordConversion } from "@/lib/limits";

export const dynamic = "force-dynamic";
export const runtime  = "nodejs";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB
const MAX_OUTPUT_DIM = 8192;

export async function POST(request: NextRequest) {
  try {
    const session  = await auth();
    const formData = await request.formData();

    const file = formData.get("file") as File | null;
    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return Response.json({ error: "File exceeds 20 MB limit." }, { status: 400 });
    }

    const fileSizeMB = file.size / (1024 * 1024);

    if (session?.user?.id) {
      const check = checkAndIncrementLimit(session.user.id, fileSizeMB);
      if (!check.allowed) {
        return Response.json(
          { error: check.reason, code: "RATE_LIMIT" },
          { status: 429 }
        );
      }
    } else if (fileSizeMB > 10) {
      return Response.json(
        { error: "File exceeds 10 MB. Sign up for free to upscale larger files." },
        { status: 400 }
      );
    }

    const scaleStr = (formData.get("scale") as string) || "2";
    const scale = parseInt(scaleStr);
    if (scale !== 2 && scale !== 4) {
      return Response.json({ error: "Scale must be 2 or 4." }, { status: 400 });
    }

    const outputFmtRaw = ((formData.get("outputFormat") as string) || "").toLowerCase() ||
      file.type.split("/")[1]?.replace("jpeg", "jpg") || "jpg";

    const buffer = Buffer.from(await file.arrayBuffer());
    const metadata = await sharp(buffer).metadata();
    const origWidth  = metadata.width  || 0;
    const origHeight = metadata.height || 0;

    if (!origWidth || !origHeight) {
      return Response.json({ error: "Could not read image dimensions." }, { status: 400 });
    }

    // Clamp output dimensions to MAX_OUTPUT_DIM
    const targetWidth  = Math.min(origWidth * scale, MAX_OUTPUT_DIM);
    const targetHeight = Math.min(origHeight * scale, MAX_OUTPUT_DIM);

    let pipeline = sharp(buffer)
      .resize(targetWidth, targetHeight, {
        kernel: "lanczos3",
        fastShrinkOnLoad: false,
      })
      .sharpen({
        sigma: 0.5 + (scale === 4 ? 0.5 : 0),
        m1: 1.0,
        m2: 2.0,
      });

    let outputBuffer: Buffer;
    let contentType: string;
    let ext: string;

    switch (outputFmtRaw) {
      case "jpg":
      case "jpeg":
        pipeline = pipeline.flatten({ background: "#ffffff" });
        outputBuffer = await pipeline.jpeg({ quality: 90, mozjpeg: true }).toBuffer();
        contentType = "image/jpeg"; ext = "jpg"; break;
      case "png":
        outputBuffer = await pipeline.png().toBuffer();
        contentType = "image/png"; ext = "png"; break;
      case "webp":
        outputBuffer = await pipeline.webp({ quality: 90 }).toBuffer();
        contentType = "image/webp"; ext = "webp"; break;
      default:
        pipeline = pipeline.flatten({ background: "#ffffff" });
        outputBuffer = await pipeline.jpeg({ quality: 90, mozjpeg: true }).toBuffer();
        contentType = "image/jpeg"; ext = "jpg";
    }

    const base = file.name.replace(/\.[^/.]+$/, "") || "upscaled";

    if (session?.user?.id) {
      recordConversion({
        userId: session.user.id,
        filename: file.name,
        fromFormat: file.type.split("/")[1] || "unknown",
        toFormat: ext,
        tool: "upscale",
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
        "Content-Disposition": `attachment; filename="${base}-upscaled-${scale}x.${ext}"`,
        "Content-Length": outputBuffer.byteLength.toString(),
        "Cache-Control": "no-store",
        "X-Original-Width": origWidth.toString(),
        "X-Original-Height": origHeight.toString(),
        "X-New-Width": targetWidth.toString(),
        "X-New-Height": targetHeight.toString(),
      },
    });
  } catch (err) {
    console.error("Upscale error:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Upscale failed" },
      { status: 500 }
    );
  }
}
