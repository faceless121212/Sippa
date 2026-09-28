import Image from "next/image";
import { withBase } from "@/lib/paths";
import generated from "@/data/avatar-manifest.json";
import { cn } from "@/lib/utils";

const hasGenerated = new Set<string>(generated);

function isTemporaryPreview(url: string) {
  try {
    const host = new URL(url).hostname;
    return host === "fal.media" || host.endsWith(".fal.media");
  } catch {
    return false;
  }
}

type Props = {
  id: string;
  name: string;
  className?: string;
  /** Load eagerly for above-the-fold images. */
  priority?: boolean;
  /** Rendered width hint for responsive sizes. */
  sizes?: string;
  /** Explicit portrait URL (user-created characters). Seed characters fall back to /characters/<id>.jpg. */
  src?: string | null;
};

/**
 * Character portrait. Uses the AI-generated image in /public/characters when
 * one exists (see `npm run avatars`), otherwise a neutral initial tile.
 */
export function CharacterAvatar({
  id,
  name,
  className,
  priority,
  sizes = "(min-width: 1024px) 240px, 50vw",
  src,
}: Props) {
  const raw = src || (hasGenerated.has(id) ? `/characters/${id}.jpg` : null);
  // Public files need the base path when the site is served from a sub-path (GitHub Pages).
  const url = raw ? withBase(raw) : null;
  // Unsaved creator previews point at temporary fal.ai URLs, which aren't in
  // next/image's allow-list (and aren't worth optimising) — render them directly.
  if (url && isTemporaryPreview(url)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- temporary provider URL
      <img
        src={url}
        alt={`AI-generated portrait of ${name}`}
        width={768}
        height={1024}
        className={cn("block h-full w-full object-cover", className)}
      />
    );
  }
  if (url) {
    return (
      <Image
        src={url}
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
    <div
      role="img"
      aria-label={`Portrait of ${name} (coming soon)`}
      className={cn(
        "from-surface-2 to-border text-muted flex h-full w-full items-center justify-center bg-gradient-to-br text-4xl font-extrabold",
        className,
      )}
    >
      {name.charAt(0)}
    </div>
  );
}
