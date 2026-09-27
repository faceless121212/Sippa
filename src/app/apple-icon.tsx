import { ImageResponse } from "next/og";
import { FlowerIcon } from "@/lib/brand-image";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(<FlowerIcon size={180} scale={0.8} />, size);
}
