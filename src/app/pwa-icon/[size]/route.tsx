import { ImageResponse } from "next/og";
import { CupIcon } from "@/lib/brand-image";

const SIZES = ["192", "512"] as const;

export const dynamic = "force-static";

export function generateStaticParams() {
  return SIZES.map((size) => ({ size }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ size: string }> }) {
  const { size } = await params;
  const px = SIZES.includes(size as (typeof SIZES)[number]) ? Number(size) : 192;
  return new ImageResponse(<CupIcon size={px} />, { width: px, height: px });
}
