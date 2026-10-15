import { cn } from "@/lib/utils";

/** Small, true facts shown before the quiz starts. No user counts we can't back up. */
const CHIPS = ["⏱ 2-minute quiz", "Free to start", "🔒 Private", "🤖 Always an AI"];

export function TrustChips({ className }: { className?: string }) {
  return (
    <ul className={cn("flex flex-wrap gap-1.5", className)} aria-label="About the quiz">
      {CHIPS.map((c) => (
        <li key={c} className="border-border bg-surface rounded-full border px-2.5 py-1 text-xs font-semibold">
          {c}
        </li>
      ))}
    </ul>
  );
}
