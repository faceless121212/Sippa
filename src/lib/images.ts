/**
 * Image-generation provider wrapper (fal.ai). Server/CLI only — never import
 * from client components: it reads FAL_KEY.
 */

export type GenerateImageOptions = {
  prompt: string;
  /** fal.ai size preset. Portrait 3:4 by default (768×1024). */
  size?: "portrait_4_3" | "square_hd" | "portrait_16_9";
  seed?: number;
  /** How many images (1–4). */
  count?: number;
};

export type GeneratedImage = { url: string; contentType: string };

const DEFAULT_MODEL = "fal-ai/flux/dev";

export async function generateImage(opts: GenerateImageOptions): Promise<GeneratedImage> {
  const [first] = await generateImages({ ...opts, count: 1 });
  return first;
}

/** Several images from one prompt. Images the provider flags as unsafe are dropped. */
export async function generateImages({
  prompt,
  size = "portrait_4_3",
  seed,
  count = 4,
}: GenerateImageOptions): Promise<GeneratedImage[]> {
  const key = process.env.FAL_KEY;
  if (!key) throw new Error("FAL_KEY is not set. Add it to .env.local.");
  if (process.env.SIPPA_OFFLINE_AI === "1") throw new Error("Image generation is off (SIPPA_OFFLINE_AI=1).");
  const model = process.env.FAL_IMAGE_MODEL || DEFAULT_MODEL;

  const res = await fetch(`https://fal.run/${model}`, {
    method: "POST",
    headers: { Authorization: `Key ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt,
      image_size: size,
      num_images: Math.min(4, Math.max(1, count)),
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
  const images = (data.images ?? [])
    .filter((_, i) => !data.has_nsfw_concepts?.[i])
    .map((img) => ({ url: img.url, contentType: img.content_type ?? "image/jpeg" }));
  if (!images.length) {
    throw new Error(
      data.images?.length
        ? "Image was flagged by the provider's safety checker."
        : "fal.ai returned no image.",
    );
  }
  return images;
}
