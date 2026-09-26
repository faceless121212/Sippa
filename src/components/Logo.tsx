import { cn } from "@/lib/utils";

/** Placeholder mark: lime cup with steam on a black tile. Same in both themes. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("h-7 w-7", className)} aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#000" />
      <path
        d="M12 5 q-2 2.5 0 5 M16.5 4.5 q-2 3 0 6"
        stroke="#C3FF00"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
      />
      <path d="M6.5 13 h16 v5.5 a6.5 6.5 0 0 1 -6.5 6.5 h-3 a6.5 6.5 0 0 1 -6.5 -6.5 z" fill="#C3FF00" />
      <path d="M22.5 15 h1.2 a2.8 2.8 0 0 1 0 5.6 H22" stroke="#C3FF00" strokeWidth="2" fill="none" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark />
      <span className="text-xl font-bold tracking-tight">Sippa</span>
    </span>
  );
}
