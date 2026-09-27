import { ImageResponse } from "next/og";
import { FlowerIcon } from "@/lib/brand-image";

// "512-maskable" keeps the flower inside the 80% safe zone that Android crops to.
const SIZES = ["192", "512", "512-maskable"] as const;

export const dynamic = "force-static";

export function generateStaticParams() {
  return SIZES.map((size) => ({ size }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ size: string }> }) {
  const { size } = await params;
  const known = SIZES.includes(size as (typeof SIZES)[number]) ? size : "192";
  const px = parseInt(known, 10);
  const scale = known.endsWith("maskable") ? 0.6 : 0.85;
  return new ImageResponse(<FlowerIcon size={px} scale={scale} />, { width: px, height: px });
}
