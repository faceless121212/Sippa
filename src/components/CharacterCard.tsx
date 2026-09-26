import { MessageCircle } from "lucide-react";
import { categoryStyles } from "@/config/categories";
import type { SampleCharacter } from "@/data/landing";
import { cn, formatCount } from "@/lib/utils";
import { CharacterAvatar } from "./CharacterAvatar";

/** Tall portrait card: full-bleed image with name, hook and tags over a gradient. */
export function CharacterCard({
  character,
  className,
  priority,
}: {
  character: SampleCharacter;
  className?: string;
  priority?: boolean;
}) {
  const style = categoryStyles[character.category];
  const badge =
    character.famousType === "historical"
      ? "Historical"
      : character.famousType === "inspired"
        ? "Inspired-by"
        : null;

  return (
    <article
      className={cn(
        "group bg-surface-2 relative isolate aspect-[3/4] overflow-hidden rounded-xl ring-1 ring-black/5 dark:ring-white/10",
        className,
      )}
    >
      <CharacterAvatar
        id={character.id}
        name={character.name}
        priority={priority}
        className="absolute inset-0 -z-10 transition-transform duration-500 group-hover:scale-105"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-t from-black/90 via-black/30 via-45% to-transparent"
      />

      <div className="flex items-start justify-between gap-2 p-2.5">
        {character.messages > 0 ? (
          <span className="inline-flex items-center gap-1 rounded-md bg-black/55 px-1.5 py-0.5 text-[11px] font-semibold text-white backdrop-blur-sm">
            <MessageCircle className="h-3 w-3" aria-hidden="true" />
            {formatCount(character.messages)}
            <span className="sr-only"> messages</span>
          </span>
        ) : (
          <span />
        )}
        {badge && (
          <span className="rounded-md bg-black/55 px-1.5 py-0.5 text-[11px] font-semibold text-white backdrop-blur-sm">
            {badge}
          </span>
        )}
      </div>

      <div className="absolute inset-x-0 bottom-0 p-3 text-white">
        <h3 className="flex items-center gap-1.5 text-[15px] leading-tight font-bold">
          <span className={cn("h-2 w-2 shrink-0 rounded-full", style.fill)} aria-hidden="true" />
          <span className="truncate">{character.name}</span>
          {character.age ? <span className="font-medium text-white/70">{character.age}</span> : null}
        </h3>
        <p className="mt-1 line-clamp-2 text-xs leading-snug text-white/80">{character.hook}</p>
        <ul className="mt-2 flex flex-wrap gap-1" aria-label="Tags">
          {character.tags.slice(0, 2).map((tag) => (
            <li
              key={tag}
              className="rounded-md bg-white/15 px-1.5 py-0.5 text-[10px] font-semibold backdrop-blur-sm"
            >
              {tag}
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
