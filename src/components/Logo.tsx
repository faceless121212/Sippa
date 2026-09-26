import { cn } from "@/lib/utils";

/** Placeholder cup-and-steam mark. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("h-7 w-7", className)} aria-hidden="true">
      <path
        d="M12 3 q-2.5 3 0 6 M17 2 q-2.5 3.5 0 7"
        stroke="var(--primary)"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <path d="M5 12 h19 v7 a8 8 0 0 1 -8 8 h-3 a8 8 0 0 1 -8 -8 z" fill="var(--primary)" />
      <path d="M24 14 h1.5 a3.5 3.5 0 0 1 0 7 H23" stroke="var(--primary)" strokeWidth="2.4" fill="none" />
      <rect x="4" y="28.5" width="21" height="2" rx="1" fill="var(--primary)" opacity="0.6" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark />
      <span className="font-display text-2xl font-semibold tracking-tight">Sippa</span>
    </span>
  );
}
