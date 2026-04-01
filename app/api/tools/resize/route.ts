import type { NextRequest } from "next/server";
import sharp from "sharp";
import { auth } from "@/auth";
import { checkAndIncrementLimit, recordConversion } from "@/lib/limits";

export const dynamic = "force-dynamic";
export const runtime  = "nodejs";

type FitMode = "contain" | "cover" | "fill" | "inside" | "outside";

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

    const widthStr  = formData.get("width")  as string | null;
    const heightStr = formData.get("height") as string | null;
    const width     = widthStr  ? parseInt(widthStr)  : undefined;
    const height    = heightStr ? parseInt(heightStr) : undefined;

    if (!width && !height) {
      return Response.json({ error: "Width or height is required" }, { status: 400 });
    }

    const fitRaw    = (formData.get("fit") as string) || "inside";
    const validFits: FitMode[] = ["contain", "cover", "fill", "inside", "outside"];
    const fit: FitMode = validFits.includes(fitRaw as FitMode) ? (fitRaw as FitMode) : "inside";

    const bgColor   = (formData.get("background") as string) || "#ffffff";
    const outputFmt = ((formData.get("outputFormat") as string) || "").toLowerCase() ||
      file.type.split("/")[1]?.replace("jpeg", "jpg") || "jpg";

    const buffer   = Buffer.from(await file.arrayBuffer());
    let pipeline   = sharp(buffer).resize(width ?? null, height ?? null, {
      fit,
      withoutEnlargement: true,
      background: bgColor,
    });

    // Flatten for formats that don't support transparency
    if (["jpg", "jpeg"].includes(outputFmt)) {
      pipeline = pipeline.flatten({ background: bgColor });
    }

    let outputBuffer: Buffer;
    let contentType: string;
    let ext: string;

    switch (outputFmt) {
      case "jpg":
      case "jpeg":
        outputBuffer = await pipeline.jpeg({ quality: 90 }).toBuffer();
        contentType = "image/jpeg"; ext = "jpg"; break;
      case "png":
        outputBuffer = await pipeline.png().toBuffer();
        contentType = "image/png"; ext = "png"; break;
      case "webp":
        outputBuffer = await pipeline.webp({ quality: 90 }).toBuffer();
        contentType = "image/webp"; ext = "webp"; break;
      default:
        outputBuffer = await pipeline.jpeg({ quality: 90 }).toBuffer();
        contentType = "image/jpeg"; ext = "jpg";
    }

    const base = file.name.replace(/\.[^/.]+$/, "") || "resized";

    if (session?.user?.id) {
      recordConversion({
        userId: session.user.id,
        filename: file.name,
        fromFormat: file.type.split("/")[1] || "unknown",
        toFormat: ext,
        tool: "resize",
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
        "Content-Disposition": `attachment; filename="${base}-resized.${ext}"`,
        "Content-Length": outputBuffer.byteLength.toString(),
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("Resize error:", err);
    return Response.json({ error: err instanceof Error ? err.message : "Resize failed" }, { status: 500 });
  }
}
