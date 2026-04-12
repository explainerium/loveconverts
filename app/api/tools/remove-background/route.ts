import type { NextRequest } from "next/server";
import sharp from "sharp";
import { auth } from "@/auth";
import { checkAndIncrementLimit, recordConversion } from "@/lib/limits";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let session: any = null;
    try { session = await auth(); } catch {}

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
      return Response.json({ error: "File exceeds 10 MB. Sign up for free to process larger files." }, { status: 400 });
    }

    const threshold = Math.min(60, Math.max(5, parseInt((formData.get("threshold") as string) || "30")));
    const buffer = Buffer.from(await file.arrayBuffer());

    const image = sharp(buffer).ensureAlpha();
    const meta = await image.metadata();
    if (!meta.width || !meta.height) return Response.json({ error: "Invalid image" }, { status: 400 });

    const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });

    // Sample corners to detect background color
    const samplePixel = (x: number, y: number) => {
      const idx = (y * info.width + x) * info.channels;
      return { r: data[idx], g: data[idx + 1], b: data[idx + 2] };
    };

    const corners = [
      samplePixel(0, 0),
      samplePixel(info.width - 1, 0),
      samplePixel(0, info.height - 1),
      samplePixel(info.width - 1, info.height - 1),
    ];

    const bgR = Math.round(corners.reduce((s, c) => s + c.r, 0) / 4);
    const bgG = Math.round(corners.reduce((s, c) => s + c.g, 0) / 4);
    const bgB = Math.round(corners.reduce((s, c) => s + c.b, 0) / 4);

    // Make pixels close to background color transparent
    const t = threshold * 2.55;
    for (let i = 0; i < data.length; i += info.channels) {
      const dr = Math.abs(data[i] - bgR);
      const dg = Math.abs(data[i + 1] - bgG);
      const db = Math.abs(data[i + 2] - bgB);
      const dist = Math.sqrt(dr * dr + dg * dg + db * db);

      if (dist < t) {
        data[i + 3] = 0;
      } else if (dist < t * 1.5) {
        data[i + 3] = Math.min(255, Math.round(((dist - t) / (t * 0.5)) * 255));
      }
    }

    const outputBuffer = await sharp(data, {
      raw: { width: info.width, height: info.height, channels: info.channels as 4 },
    }).png().toBuffer();

    const base = (file.name.replace(/\.[^/.]+$/, "") || "nobg").replace(/[^\x20-\x7E]/g, "").replace(/\s+/g, "_") || "nobg";

    if (session?.user?.id) {
      recordConversion({
        userId: session.user.id,
        filename: file.name,
        fromFormat: file.type.split("/")[1] || "unknown",
        toFormat: "png",
        tool: "remove-background",
        originalSize: file.size,
        convertedSize: outputBuffer.byteLength,
      });
    }

    return new Response(outputBuffer.buffer.slice(outputBuffer.byteOffset, outputBuffer.byteOffset + outputBuffer.byteLength) as ArrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="${base}-nobg.png"`,
        "Content-Length": outputBuffer.byteLength.toString(),
        "Cache-Control": "no-store",
        "X-Original-Size": file.size.toString(),
        "X-Compressed-Size": outputBuffer.byteLength.toString(),
      },
    });
  } catch (err) {
    console.error("Remove background error:", err);
    return Response.json({ error: err instanceof Error ? err.message : "Background removal failed" }, { status: 500 });
  }
}
