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

    const quality  = Math.min(100, Math.max(1, parseInt((formData.get("quality") as string) || "90")));
    const bgColor  = (formData.get("background") as string) || "#ffffff";

    const buffer = Buffer.from(await file.arrayBuffer());
    const outputBuffer = await sharp(buffer)
      .flatten({ background: bgColor })
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();

    const base = (file.name.replace(/\.[^/.]+$/, "") || "image").replace(/[^\x20-\x7E]/g, "").replace(/\s+/g, "_") || "image";

    if (session?.user?.id) {
      recordConversion({
        userId: session.user.id,
        filename: file.name,
        fromFormat: file.type.split("/")[1] || "unknown",
        toFormat: "jpg",
        tool: "convert-to-jpg",
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
        "Content-Type": "image/jpeg",
        "Content-Disposition": `attachment; filename="${base}.jpg"`,
        "Content-Length": outputBuffer.byteLength.toString(),
        "Cache-Control": "no-store",
        "X-Original-Size": file.size.toString(),
        "X-Output-Size": outputBuffer.byteLength.toString(),
      },
    });
  } catch (err) {
    console.error("Convert-to-jpg error:", err);
    return Response.json({ error: err instanceof Error ? err.message : "Conversion failed" }, { status: 500 });
  }
}
