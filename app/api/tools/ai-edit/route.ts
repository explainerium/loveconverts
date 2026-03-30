import Replicate from "replicate";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const prompt = formData.get("prompt") as string | null;

    if (!file) {
      return Response.json({ error: "No image provided" }, { status: 400 });
    }

    if (!prompt?.trim()) {
      return Response.json({ error: "Please describe your edit" }, { status: 400 });
    }

    if (file.size > 20 * 1024 * 1024) {
      return Response.json({ error: "File too large. Max 20 MB." }, { status: 400 });
    }

    if (!process.env.REPLICATE_API_TOKEN) {
      return Response.json({ error: "AI editing service is not configured." }, { status: 503 });
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mimeType = file.type || "image/jpeg";
    const dataUrl = `data:${mimeType};base64,${base64}`;

    const output = await replicate.run(
      "black-forest-labs/flux-kontext-pro",
      {
        input: {
          prompt: prompt.trim(),
          input_image: dataUrl,
        },
      }
    );

    const resultUrl = Array.isArray(output) ? output[0] : output;
    return Response.json({ url: resultUrl });
  } catch (err) {
    console.error("AI edit error:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "AI editing failed" },
      { status: 500 }
    );
  }
}
