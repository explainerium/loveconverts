import Replicate from "replicate";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

const VALID_RATIOS = new Set(["1:1", "16:9", "9:16", "4:3", "3:2"]);

export async function POST(req: Request) {
  try {
    if (!process.env.REPLICATE_API_TOKEN) {
      console.error("[text-to-image] REPLICATE_API_TOKEN is not set");
      return Response.json(
        { error: "Image generation service is not configured." },
        { status: 503 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return Response.json({ error: "Invalid request body" }, { status: 400 });
    }

    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
    const aspectRatio =
      typeof body.aspectRatio === "string" && VALID_RATIOS.has(body.aspectRatio)
        ? body.aspectRatio
        : "1:1";

    if (!prompt) {
      return Response.json({ error: "Please describe the image you want." }, { status: 400 });
    }
    if (prompt.length > 600) {
      return Response.json({ error: "Prompt is too long. Max 600 characters." }, { status: 400 });
    }

    const output = await replicate.run("black-forest-labs/flux-schnell", {
      input: {
        prompt,
        num_outputs: 1,
        aspect_ratio: aspectRatio,
        output_format: "webp",
        output_quality: 90,
        num_inference_steps: 4,
      },
    });

    // flux-schnell returns an array of FileOutput objects or URLs
    // Normalize to a single URL string
    let url: string | null = null;
    const first = Array.isArray(output) ? output[0] : output;
    if (typeof first === "string") {
      url = first;
    } else if (first && typeof (first as { url?: () => URL }).url === "function") {
      // FileOutput has a .url() method returning a URL object
      url = (first as { url: () => URL }).url().toString();
    } else if (first && typeof first === "object" && "href" in (first as object)) {
      url = String((first as { href: unknown }).href);
    }

    if (!url) {
      console.error("[text-to-image] Unexpected output shape:", output);
      return Response.json({ error: "No image was returned. Please try again." }, { status: 500 });
    }

    return Response.json({ imageUrl: url });
  } catch (err) {
    console.error("[text-to-image] error:", err);
    return Response.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
