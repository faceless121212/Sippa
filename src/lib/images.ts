/**
 * Image-generation provider wrapper (fal.ai). Server/CLI only — never import
 * from client components: it reads FAL_KEY.
 */

export type GenerateImageOptions = {
  prompt: string;
  /** fal.ai size preset. Portrait 3:4 by default (768×1024). */
  size?: "portrait_4_3" | "square_hd" | "portrait_16_9";
  seed?: number;
};

export type GeneratedImage = { url: string; contentType: string };

const DEFAULT_MODEL = "fal-ai/flux/dev";

export async function generateImage({
  prompt,
  size = "portrait_4_3",
  seed,
}: GenerateImageOptions): Promise<GeneratedImage> {
  const key = process.env.FAL_KEY;
  if (!key) throw new Error("FAL_KEY is not set. Add it to .env.local.");
  const model = process.env.FAL_IMAGE_MODEL || DEFAULT_MODEL;

  const res = await fetch(`https://fal.run/${model}`, {
    method: "POST",
    headers: { Authorization: `Key ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt,
      image_size: size,
      num_images: 1,
      output_format: "jpeg",
      enable_safety_checker: true,
      ...(seed !== undefined ? { seed } : {}),
    }),
  });
  if (!res.ok) {
    throw new Error(`fal.ai ${model} failed: ${res.status} ${await res.text().catch(() => "")}`.trim());
  }
  const data = (await res.json()) as {
    images?: { url: string; content_type?: string }[];
    has_nsfw_concepts?: boolean[];
  };
  if (data.has_nsfw_concepts?.[0]) throw new Error("Image was flagged by the provider's safety checker.");
  const image = data.images?.[0];
  if (!image?.url) throw new Error("fal.ai returned no image.");
  return { url: image.url, contentType: image.content_type ?? "image/jpeg" };
}
