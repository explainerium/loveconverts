import type { NextRequest } from "next/server";
import sharp from "sharp";
import { auth } from "@/auth";
import { checkAndIncrementLimit, recordConversion } from "@/lib/limits";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Position =
  | "center"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | "tiled";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildSvgOverlay(
  text: string,
  fontSize: number,
  opacity: number,
  color: string,
  position: Position,
  imgWidth: number,
  imgHeight: number
): Buffer {
  const escaped = escapeXml(text);
  // opacity is 0-100 from client, convert to 0-1
  const alpha = opacity / 100;

  if (position === "tiled") {
    // Create a repeating tiled pattern
    const tileW = Math.max(fontSize * text.length * 0.7, 120);
    const tileH = fontSize * 2.5;
    const cols = Math.ceil(imgWidth / tileW) + 1;
    const rows = Math.ceil(imgHeight / tileH) + 1;

    let textElements = "";
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * tileW + (row % 2 === 1 ? tileW / 2 : 0);
        const y = row * tileH + tileH / 2;
        textElements += `<text x="${x}" y="${y}" font-size="${fontSize}" fill="${color}" opacity="${alpha}" font-family="Arial, Helvetica, sans-serif" font-weight="bold" transform="rotate(-30, ${x}, ${y})">${escaped}</text>`;
      }
    }

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${imgWidth}" height="${imgHeight}">${textElements}</svg>`;
    return Buffer.from(svg);
  }

  // Single watermark at a specific position
  let x: number;
  let y: number;
  let anchor: string;
  let dominantBaseline: string;
  const pad = fontSize;

  switch (position) {
    case "top-left":
      x = pad;
      y = pad + fontSize;
      anchor = "start";
      dominantBaseline = "auto";
      break;
    case "top-right":
      x = imgWidth - pad;
      y = pad + fontSize;
      anchor = "end";
      dominantBaseline = "auto";
      break;
    case "bottom-left":
      x = pad;
      y = imgHeight - pad;
      anchor = "start";
      dominantBaseline = "auto";
      break;
    case "bottom-right":
      x = imgWidth - pad;
      y = imgHeight - pad;
      anchor = "end";
      dominantBaseline = "auto";
      break;
    case "center":
    default:
      x = imgWidth / 2;
      y = imgHeight / 2;
      anchor = "middle";
      dominantBaseline = "central";
      break;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${imgWidth}" height="${imgHeight}">
    <text x="${x}" y="${y}" font-size="${fontSize}" fill="${color}" opacity="${alpha}" font-family="Arial, Helvetica, sans-serif" font-weight="bold" text-anchor="${anchor}" dominant-baseline="${dominantBaseline}">${escaped}</text>
  </svg>`;

  return Buffer.from(svg);
}

export async function POST(request: NextRequest) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let session: any = null;
    try { session = await auth(); } catch { /* auth failed, continue as anonymous */ }
    const formData = await request.formData();

    const file = formData.get("file") as File | null;
    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    const fileSizeMB = file.size / (1024 * 1024);

    if (fileSizeMB > 20) {
      return Response.json(
        { error: "File exceeds 20 MB limit." },
        { status: 400 }
      );
    }

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
        return Response.json(
          { error: "File exceeds 10 MB. Sign up for free to watermark larger files." },
          { status: 400 }
        );
      }
    }

    const text = (formData.get("text") as string) || "Watermark";
    const fontSize = Math.min(120, Math.max(12, parseInt((formData.get("fontSize") as string) || "32")));
    const opacity = Math.min(100, Math.max(10, parseInt((formData.get("opacity") as string) || "50")));
    const color = (formData.get("color") as string) || "#ffffff";
    const position = ((formData.get("position") as string) || "center") as Position;

    const buffer = Buffer.from(await file.arrayBuffer());
    const image = sharp(buffer);
    const metadata = await image.metadata();
    const imgWidth = metadata.width || 800;
    const imgHeight = metadata.height || 600;

    const svgOverlay = buildSvgOverlay(
      text,
      fontSize,
      opacity,
      color,
      position,
      imgWidth,
      imgHeight
    );

    const outputBuffer = await image
      .composite([{ input: svgOverlay, top: 0, left: 0 }])
      .toBuffer();

    // Determine output format from input
    const fmt = metadata.format || "jpeg";
    const extMap: Record<string, string> = {
      jpeg: "jpg",
      jpg: "jpg",
      png: "png",
      webp: "webp",
      avif: "avif",
    };
    const ext = extMap[fmt] || "jpg";
    const contentTypeMap: Record<string, string> = {
      jpg: "image/jpeg",
      png: "image/png",
      webp: "image/webp",
      avif: "image/avif",
    };
    const contentType = contentTypeMap[ext] || "image/jpeg";

    const base = (file.name.replace(/\.[^/.]+$/, "") || "watermarked").replace(/[^\x20-\x7E]/g, "").replace(/\s+/g, "_") || "watermarked";

    if (session?.user?.id) {
      recordConversion({
        userId: session.user.id,
        filename: file.name,
        fromFormat: file.type.split("/")[1] || "unknown",
        toFormat: ext,
        tool: "watermark",
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
        "Content-Disposition": `attachment; filename="${base}-watermarked.${ext}"`,
        "Content-Length": outputBuffer.byteLength.toString(),
        "Cache-Control": "no-store",
        "X-Original-Size": file.size.toString(),
        "X-Watermarked-Size": outputBuffer.byteLength.toString(),
      },
    });
  } catch (err) {
    console.error("Watermark error:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Watermark processing failed" },
      { status: 500 }
    );
  }
}
