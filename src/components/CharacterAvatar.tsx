import Image from "next/image";
import generated from "@/data/avatar-manifest.json";
import { cn } from "@/lib/utils";

const hasGenerated = new Set<string>(generated);

type Props = {
  id: string;
  name: string;
  className?: string;
  /** Load eagerly for above-the-fold images. */
  priority?: boolean;
  /** Rendered width hint for responsive sizes. */
  sizes?: string;
};

/**
 * Character portrait. Uses the AI-generated image in /public/characters when
 * one exists (see `npm run avatars`), otherwise the drawn SVG placeholder.
 */
export function CharacterAvatar({
  id,
  name,
  className,
  priority,
  sizes = "(min-width: 1024px) 240px, 50vw",
}: Props) {
  if (hasGenerated.has(id)) {
    return (
      <Image
        src={`/characters/${id}.jpg`}
        alt={`AI-generated portrait of ${name}`}
        width={768}
        height={1024}
        sizes={sizes}
        priority={priority}
        className={cn("block h-full w-full object-cover", className)}
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static SVG placeholder
    <img
      src={`/avatars/${id}.svg`}
      alt={`Illustrated portrait of ${name}`}
      width={120}
      height={160}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      className={cn("block h-full w-full object-cover", className)}
    />
  );
}
