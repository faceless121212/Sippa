import { MessageCircle } from "lucide-react";
import { categoryStyles } from "@/config/categories";
import type { SampleCharacter } from "@/data/landing";
import { cn, formatCount } from "@/lib/utils";
import { CharacterAvatar } from "./CharacterAvatar";

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
  return (
    <article
      className={cn(
        "group border-border bg-surface flex flex-col overflow-hidden rounded-xl border",
        className,
      )}
    >
      <div className="relative aspect-[3/4] overflow-hidden">
        <CharacterAvatar
          id={character.id}
          name={character.name}
          priority={priority}
          className="transition-transform duration-500 group-hover:scale-105"
        />
        {character.messages > 0 && (
          <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white">
            <MessageCircle className="h-3 w-3" aria-hidden="true" />
            {formatCount(character.messages)}
            <span className="sr-only"> messages</span>
          </span>
        )}
        {character.famousType === "historical" && (
          <span className="absolute top-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white">
            Historical
          </span>
        )}
        {character.famousType === "inspired" && (
          <span className="absolute top-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white">
            Inspired-by
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <h3 className="font-display text-base leading-tight font-semibold">
          {character.name}
          {character.age ? (
            <span className="text-muted font-sans text-sm font-normal">, {character.age}</span>
          ) : null}
        </h3>
        <p className="text-muted line-clamp-2 text-sm">{character.hook}</p>
        <ul className="mt-auto flex flex-wrap gap-1.5" aria-label="Tags">
          {character.tags.slice(0, 3).map((tag) => (
            <li
              key={tag}
              className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", style.softBg, style.ink)}
            >
              {tag}
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
