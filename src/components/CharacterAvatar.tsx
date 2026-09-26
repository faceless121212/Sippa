import { cn } from "@/lib/utils";

type Props = {
  id: string;
  name: string;
  className?: string;
  /** Load eagerly for above-the-fold images. */
  priority?: boolean;
};

/** Character portrait. Placeholder avatars are served from `/avatars/<id>.svg`. */
export function CharacterAvatar({ id, name, className, priority }: Props) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static SVG; next/image adds no value here
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
