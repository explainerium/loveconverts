import type { NextRequest } from "next/server";
import sharp from "sharp";
import { auth } from "@/auth";
import { checkAndIncrementLimit, recordConversion } from "@/lib/limits";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const cleaned = hex.replace("#", "");
  return {
    r: parseInt(cleaned.substring(0, 2), 16),
    g: parseInt(cleaned.substring(2, 4), 16),
    b: parseInt(cleaned.substring(4, 6), 16),
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const formData = await request.formData();

    const file = formData.get("file") as File | null;
    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return Response.json(
        { error: "File is not a valid image." },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return Response.json(
        { error: "File exceeds the 20 MB size limit." },
        { status: 400 },
      );
    }

    const fileSizeMB = file.size / (1024 * 1024);

    // Rate limiting
    if (session?.user?.id) {
      const check = checkAndIncrementLimit(session.user.id, fileSizeMB);
      if (!check.allowed) {
        return Response.json(
          { error: check.reason, code: "RATE_LIMIT" },
          { status: 429 },
        );
      }
    } else {
      if (fileSizeMB > 10) {
        return Response.json(
          {
            error:
              "File exceeds 10 MB. Sign up for free to process larger files.",
          },
          { status: 400 },
        );
      }
    }

    const thresholdParam = parseInt(
      (formData.get("threshold") as string) || "50",
    );
    const threshold = Math.min(100, Math.max(0, thresholdParam));
    const bgColorHex = formData.get("bgColor") as string | null;

    const buffer = Buffer.from(await file.arrayBuffer());
    const input = sharp(buffer).ensureAlpha();
    const { data, info } = await input
      .raw()
      .toBuffer({ resolveWithObject: true });

    const pixels = new Uint8Array(data);

    // Sample corners to find background color
    const cornerIndices = [
      0,
      info.width - 1,
      (info.height - 1) * info.width,
      info.width * info.height - 1,
    ];

    let bgR = 0;
    let bgG = 0;
    let bgB = 0;
    let validSamples = 0;

    for (const idx of cornerIndices) {
      const offset = idx * 4;
      if (offset + 3 < pixels.length) {
        bgR += pixels[offset];
        bgG += pixels[offset + 1];
        bgB += pixels[offset + 2];
        validSamples++;
      }
    }

    if (validSamples > 0) {
      bgR = Math.round(bgR / validSamples);
      bgG = Math.round(bgG / validSamples);
      bgB = Math.round(bgB / validSamples);
    }

    // Make pixels close to background color transparent
    const t = threshold * 2.55; // 0-100 mapped to 0-255
    for (let i = 0; i < pixels.length; i += 4) {
      const dr = Math.abs(pixels[i] - bgR);
      const dg = Math.abs(pixels[i + 1] - bgG);
      const db = Math.abs(pixels[i + 2] - bgB);
      if (dr + dg + db < t * 3) {
        if (bgColorHex) {
          // Replace with custom background color
          const rgb = hexToRgb(bgColorHex);
          pixels[i] = rgb.r;
          pixels[i + 1] = rgb.g;
          pixels[i + 2] = rgb.b;
          pixels[i + 3] = 255;
        } else {
          // Set alpha to 0 for transparency
          pixels[i + 3] = 0;
        }
      }
    }

    const result = await sharp(Buffer.from(pixels), {
      raw: { width: info.width, height: info.height, channels: 4 },
    })
      .png()
      .toBuffer();

    const base = file.name.replace(/\.[^/.]+$/, "") || "image";

    // Record conversion for logged-in users
    if (session?.user?.id) {
      recordConversion({
        userId: session.user.id,
        filename: file.name,
        fromFormat: file.type.split("/")[1] || "unknown",
        toFormat: "png",
        tool: "remove-background",
        originalSize: file.size,
        convertedSize: result.byteLength,
      });
    }

    const body = result.buffer.slice(
      result.byteOffset,
      result.byteOffset + result.byteLength,
    ) as ArrayBuffer;

    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="${base}-no-bg.png"`,
        "Content-Length": result.byteLength.toString(),
        "Cache-Control": "no-store",
        "X-Original-Size": file.size.toString(),
        "X-Result-Size": result.byteLength.toString(),
      },
    });
  } catch (err) {
    console.error("Remove-background error:", err);
    return Response.json(
      {
        error:
          err instanceof Error ? err.message : "Background removal failed",
      },
      { status: 500 },
    );
  }
}
