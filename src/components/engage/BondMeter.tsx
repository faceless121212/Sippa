import type { CategoryId } from "@/config/categories";
import { bondLevel } from "@/config/engagement";
import { cn } from "@/lib/utils";

/** Level name + progress bar for your bond with a character. */
export function BondMeter({
  xp,
  category,
  compact,
  className,
}: {
  xp: number;
  category: CategoryId;
  compact?: boolean;
  className?: string;
}) {
  const b = bondLevel(xp, category);
  return (
    <div
      className={cn("min-w-0", className)}
      title={b.nextAt ? `${b.xp}/${b.nextAt} XP to ${b.nextName}` : "Max level"}
    >
      <div className="flex items-center justify-between gap-2 text-[11px] font-semibold">
        <span className="truncate">
          <span aria-hidden="true">💞</span> Lv {b.level} · {b.name}
        </span>
        {!compact && b.nextName && <span className="text-muted shrink-0">next: {b.nextName}</span>}
      </div>
      <div
        role="progressbar"
        aria-label={`Bond level ${b.level}, ${b.name}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(b.progress * 100)}
        className="bg-surface-2 mt-1 h-1.5 overflow-hidden rounded-full"
      >
        <div
          className="bg-primary h-full rounded-full transition-[width] duration-700"
          style={{ width: `${Math.max(4, b.progress * 100)}%` }}
        />
      </div>
    </div>
  );
}
