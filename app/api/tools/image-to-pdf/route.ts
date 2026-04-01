import type { NextRequest } from "next/server";
import { PDFDocument } from "pdf-lib";
import sharp from "sharp";
import { auth } from "@/auth";
import { checkAndIncrementLimit, recordConversion } from "@/lib/limits";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const PAGE_DIMENSIONS: Record<string, { width: number; height: number }> = {
  a4: { width: 595.28, height: 841.89 },
  letter: { width: 612, height: 792 },
};

const MARGIN_VALUES: Record<string, number> = {
  none: 0,
  small: 18,
  medium: 36,
  large: 72,
};

const MAX_IMAGES = 20;
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB per image

export async function POST(request: NextRequest) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let session: any = null;
    try { session = await auth(); } catch { /* auth failed, continue as anonymous */ }
    const formData = await request.formData();

    const files = formData.getAll("files") as File[];
    const pageSize = (formData.get("pageSize") as string) || "a4";
    const orientation = (formData.get("orientation") as string) || "portrait";
    const marginKey = (formData.get("margin") as string) || "medium";
    const marginPt = MARGIN_VALUES[marginKey] ?? 36;

    if (!files || files.length === 0) {
      return Response.json({ error: "No files provided" }, { status: 400 });
    }

    if (files.length > MAX_IMAGES) {
      return Response.json(
        { error: `Maximum ${MAX_IMAGES} images allowed.` },
        { status: 400 },
      );
    }

    // Validate all files are images and within size limit
    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        return Response.json(
          { error: `"${file.name}" is not a valid image file.` },
          { status: 400 },
        );
      }
      if (file.size > MAX_FILE_SIZE) {
        return Response.json(
          { error: `"${file.name}" exceeds the 20 MB size limit.` },
          { status: 400 },
        );
      }
    }

    // Rate limiting
    const totalSizeMB = files.reduce((sum, f) => sum + f.size, 0) / (1024 * 1024);
    if (session?.user?.id) {
      const check = checkAndIncrementLimit(session.user.id, totalSizeMB);
      if (!check.allowed) {
        return Response.json(
          { error: check.reason, code: "RATE_LIMIT" },
          { status: 429 },
        );
      }
    } else {
      // Anonymous: enforce free max file size (10 MB total)
      if (totalSizeMB > 10) {
        return Response.json(
          { error: "Total file size exceeds 10 MB. Sign up for free to convert larger files." },
          { status: 400 },
        );
      }
    }

    const pdfDoc = await PDFDocument.create();

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());

      // Get image metadata via sharp
      const metadata = await sharp(buffer).metadata();
      const imgWidth = metadata.width || 800;
      const imgHeight = metadata.height || 600;

      // Determine if the image is PNG with alpha or not
      const isPng =
        file.type === "image/png" ||
        metadata.format === "png";

      // Convert via sharp to ensure compatibility
      let processedBuffer: Buffer;
      let embedFn: "embedJpg" | "embedPng";

      if (isPng) {
        processedBuffer = await sharp(buffer).png().toBuffer();
        embedFn = "embedPng";
      } else {
        processedBuffer = await sharp(buffer).jpeg({ quality: 95 }).toBuffer();
        embedFn = "embedJpg";
      }

      const embeddedImage = await pdfDoc[embedFn](processedBuffer);

      // Calculate page dimensions
      let pageWidth: number;
      let pageHeight: number;

      if (pageSize === "fit") {
        // Fit to image: use image dimensions as page size (in points, 1px ~ 0.75pt)
        pageWidth = imgWidth * 0.75;
        pageHeight = imgHeight * 0.75;
      } else {
        const dims = PAGE_DIMENSIONS[pageSize] || PAGE_DIMENSIONS.a4;
        if (orientation === "landscape") {
          pageWidth = dims.height;
          pageHeight = dims.width;
        } else {
          pageWidth = dims.width;
          pageHeight = dims.height;
        }
      }

      const page = pdfDoc.addPage([pageWidth, pageHeight]);

      // Available area after margins
      const availWidth = pageWidth - marginPt * 2;
      const availHeight = pageHeight - marginPt * 2;

      // Scale image to fit within available area while maintaining aspect ratio
      const imgAspect = imgWidth / imgHeight;
      const areaAspect = availWidth / availHeight;

      let drawWidth: number;
      let drawHeight: number;

      if (imgAspect > areaAspect) {
        // Image is wider relative to area
        drawWidth = availWidth;
        drawHeight = availWidth / imgAspect;
      } else {
        // Image is taller relative to area
        drawHeight = availHeight;
        drawWidth = availHeight * imgAspect;
      }

      // Center image within the available area
      const drawX = marginPt + (availWidth - drawWidth) / 2;
      const drawY = marginPt + (availHeight - drawHeight) / 2;

      page.drawImage(embeddedImage, {
        x: drawX,
        y: drawY,
        width: drawWidth,
        height: drawHeight,
      });
    }

    const pdfBytes = await pdfDoc.save();
    const pdfBuffer = Buffer.from(pdfBytes);

    // Record conversion for logged-in users
    if (session?.user?.id) {
      recordConversion({
        userId: session.user.id,
        filename: files.length === 1 ? files[0].name : `${files.length} images`,
        fromFormat: "image",
        toFormat: "pdf",
        tool: "image-to-pdf",
        originalSize: files.reduce((sum, f) => sum + f.size, 0),
        convertedSize: pdfBuffer.byteLength,
      });
    }

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="images.pdf"',
        "Content-Length": pdfBuffer.byteLength.toString(),
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("Image-to-PDF error:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Conversion failed" },
      { status: 500 },
    );
  }
}
