import { cn } from "@/lib/utils";

/** Compact mark for tight spaces (placeholder pages): the "S" on a black tile. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("h-7 w-7", className)} aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#000" />
      <text
        x="16"
        y="23"
        textAnchor="middle"
        fontFamily="Inter, system-ui, sans-serif"
        fontSize="21"
        fontWeight="800"
        fill="#C3FF00"
      >
        S
      </text>
    </svg>
  );
}

/** Wordmark: the name only, with a lime full stop. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("text-[22px] leading-none font-extrabold tracking-[-0.04em]", className)}>
      sippa
      <span className="text-primary-ink dark:text-primary">.</span>
    </span>
  );
}
