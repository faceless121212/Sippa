import Image from "next/image";
import { cn } from "@/lib/utils";

/** Sippa's generated 3D brand icons (public/brand, made by `npm run brand:icons`). */
export function BrandIcon({
  name,
  size = 28,
  className,
}: {
  name: "plus" | "beans" | "cup";
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cn("inline-block shrink-0 overflow-hidden rounded-[28%] bg-black", className)}
      style={{ width: size, height: size }}
    >
      <Image
        src={`/brand/${name}.jpg`}
        alt=""
        width={size * 2}
        height={size * 2}
        className="h-full w-full scale-125 object-cover"
      />
    </span>
  );
}
