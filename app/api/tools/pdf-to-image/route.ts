import type { NextRequest } from "next/server";
import sharp from "sharp";
import { auth } from "@/auth";
import { checkAndIncrementLimit, recordConversion } from "@/lib/limits";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

/**
 * Parse a page range string into an array of 0-based page indices.
 * Examples: "all" → null (all pages), "1-5" → [0,1,2,3,4], "1,3,5" → [0,2,4]
 */
function parsePageRange(
  input: string,
  totalPages: number,
): number[] | null {
  const trimmed = input.trim().toLowerCase();
  if (trimmed === "all" || trimmed === "") return null; // null means all pages

  const indices = new Set<number>();

  const parts = trimmed.split(",").map((s) => s.trim());
  for (const part of parts) {
    if (part.includes("-")) {
      const [startStr, endStr] = part.split("-").map((s) => s.trim());
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (isNaN(start) || isNaN(end)) continue;
      for (let i = Math.max(1, start); i <= Math.min(totalPages, end); i++) {
        indices.add(i - 1); // Convert to 0-based
      }
    } else {
      const num = parseInt(part, 10);
      if (!isNaN(num) && num >= 1 && num <= totalPages) {
        indices.add(num - 1); // Convert to 0-based
      }
    }
  }

  if (indices.size === 0) return null;
  return Array.from(indices).sort((a, b) => a - b);
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const formData = await request.formData();

    const file = formData.get("file") as File | null;
    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return Response.json(
        { error: "File is not a valid PDF." },
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
              "File exceeds 10 MB. Sign up for free to convert larger files.",
          },
          { status: 400 },
        );
      }
    }

    const outputFormat = ((formData.get("format") as string) || "jpg").toLowerCase();
    const quality = Math.min(
      100,
      Math.max(1, parseInt((formData.get("quality") as string) || "85")),
    );
    const pagesInput = (formData.get("pages") as string) || "all";

    const buffer = Buffer.from(await file.arrayBuffer());

    // Try to read the PDF with sharp (requires libvips with poppler/pdfium support)
    let totalPages: number;
    try {
      const metadata = await sharp(buffer, { pages: -1 }).metadata();
      totalPages = metadata.pages || 1;
    } catch {
      return Response.json(
        {
          error:
            "PDF conversion is not available on this server. It requires libvips compiled with poppler or pdfium support.",
        },
        { status: 501 },
      );
    }

    const selectedPages = parsePageRange(pagesInput, totalPages);
    const pageIndices = selectedPages || Array.from({ length: totalPages }, (_, i) => i);

    // Limit to 50 pages max to prevent abuse
    if (pageIndices.length > 50) {
      return Response.json(
        { error: "Maximum 50 pages can be converted at once." },
        { status: 400 },
      );
    }

    const results: { page: number; data: string; width: number; height: number }[] = [];

    for (const pageIndex of pageIndices) {
      try {
        let pageBuffer: Buffer;
        let pageMetadata;

        const pageSharp = sharp(buffer, { page: pageIndex, density: 150 });

        if (outputFormat === "png") {
          pageBuffer = await pageSharp.png({ compressionLevel: Math.floor((100 - quality) / 11) }).toBuffer();
        } else {
          pageBuffer = await pageSharp.jpeg({ quality, mozjpeg: true }).toBuffer();
        }

        pageMetadata = await sharp(pageBuffer).metadata();

        results.push({
          page: pageIndex + 1, // 1-based for display
          data: pageBuffer.toString("base64"),
          width: pageMetadata.width || 0,
          height: pageMetadata.height || 0,
        });
      } catch (pageErr) {
        console.error(`Error converting page ${pageIndex + 1}:`, pageErr);
        // Skip failed pages but continue with others
      }
    }

    if (results.length === 0) {
      return Response.json(
        { error: "Failed to convert any pages from the PDF." },
        { status: 500 },
      );
    }

    // Record conversion for logged-in users
    if (session?.user?.id) {
      const totalOutputSize = results.reduce(
        (sum, r) => sum + Math.ceil(r.data.length * 0.75),
        0,
      );
      recordConversion({
        userId: session.user.id,
        filename: file.name,
        fromFormat: "pdf",
        toFormat: outputFormat,
        tool: "pdf-to-image",
        originalSize: file.size,
        convertedSize: totalOutputSize,
      });
    }

    return Response.json(
      { pages: results },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (err) {
    console.error("PDF-to-image error:", err);
    return Response.json(
      {
        error: err instanceof Error ? err.message : "Conversion failed",
      },
      { status: 500 },
    );
  }
}
