import { MessageCircle } from "lucide-react";
import { categoryStyles, type CategoryId } from "@/config/categories";
import { showUsageStats } from "@/config/site";
import { cn, formatCount } from "@/lib/utils";
import { CharacterAvatar } from "./CharacterAvatar";

export type CardCharacter = {
  id: string;
  name: string;
  age?: number;
  category: CategoryId;
  famousType?: string;
  hook: string;
  tags: string[];
  messages: number;
  badges?: string[];
  avatarUrl?: string | null;
};

const BADGE_STYLE: Record<string, { label: string; className: string }> = {
  hot: { label: "🔥 Hot", className: "bg-[#ED5023] text-white" },
  trending: { label: "📈 Trending", className: "bg-[#389A57] text-white" },
  new: { label: "New", className: "bg-primary text-black" },
  pick: { label: "⭐ Pick", className: "bg-white text-black" },
};

/** Tall portrait card: full-bleed image with name, hook and tags over a gradient. */
export function CharacterCard({
  character,
  className,
  priority,
  rank,
}: {
  character: CardCharacter;
  className?: string;
  priority?: boolean;
  /** Position in a ranking, shown as a numbered circle in the top-left corner. */
  rank?: number;
}) {
  const style = categoryStyles[character.category];
  // At most one badge per card, most meaningful first.
  const badgeOrder = showUsageStats ? ["pick", "hot", "new", "trending"] : ["pick", "new"];
  const topBadge = badgeOrder.find((b) => character.badges?.includes(b));

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
        src={character.avatarUrl}
        priority={priority}
        className="absolute inset-0 -z-10 transition-transform duration-500 group-hover:scale-105"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-t from-black/90 via-black/30 via-45% to-transparent"
      />

      <div className="flex items-start justify-between gap-2 p-2.5">
        <span className="flex items-center gap-1.5">
          {rank !== undefined && (
            <span className="bg-primary text-on-primary flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold">
              <span className="sr-only">Rank </span>
              {rank}
            </span>
          )}
          {showUsageStats && character.messages > 0 && (
            <span className="inline-flex items-center gap-1 rounded-md bg-black/55 px-1.5 py-0.5 text-[11px] font-semibold text-white backdrop-blur-sm">
              <MessageCircle className="h-3 w-3" aria-hidden="true" />
              {formatCount(character.messages)}
              <span className="sr-only"> messages</span>
            </span>
          )}
        </span>
        {topBadge && (
          <span
            className={cn(
              "rounded-md px-1.5 py-0.5 text-[10px] font-bold shadow-sm",
              BADGE_STYLE[topBadge].className,
            )}
          >
            {BADGE_STYLE[topBadge].label}
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
