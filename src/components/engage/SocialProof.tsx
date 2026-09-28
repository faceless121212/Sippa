import { Bot, Database, ShieldCheck, ThumbsUp, Trash2, UserX } from "lucide-react";
import Link from "next/link";
import { categoryStyles } from "@/config/categories";
import type { SocialProof } from "@/lib/social-proof";
import { cn, formatCount, timeAgo } from "@/lib/utils";
import { CharacterAvatar } from "../CharacterAvatar";

const TRUST = [
  { icon: ShieldCheck, label: "Adults only (18+)" },
  { icon: UserX, label: "Never real people" },
  { icon: Bot, label: "Always an AI" },
  { icon: Trash2, label: "Delete anytime" },
  { icon: Database, label: "Data stored in the EU" },
];

/** Promises that are true today — no numbers needed. */
export function TrustStrip({ className }: { className?: string }) {
  return (
    <ul
      aria-label="Our promises"
      className={cn(
        "border-border bg-surface flex flex-wrap justify-center gap-x-6 gap-y-2 rounded-xl border px-4 py-3",
        className,
      )}
    >
      {TRUST.map(({ icon: Icon, label }) => (
        <li key={label} className="text-muted flex items-center gap-1.5 text-xs font-semibold">
          <Icon className="text-primary-ink h-4 w-4" aria-hidden="true" />
          {label}
        </li>
      ))}
    </ul>
  );
}

/** Anonymous live activity plus real totals. Renders nothing until there's something true to show. */
export function LiveOnSippa({ proof, compact = false }: { proof: SocialProof; compact?: boolean }) {
  const { activity, counters, rating } = proof;
  if (!activity.length && !counters && !rating) return null;
  const items = compact ? activity.slice(0, 3) : activity;

  return (
    <section
      aria-labelledby="live-title"
      className={cn(
        "grid min-w-0 grid-cols-1 gap-4",
        !compact && (counters || rating) && activity.length && "md:grid-cols-[1.4fr_1fr]",
      )}
    >
      {items.length > 0 && (
        <div className="border-border bg-surface min-w-0 rounded-xl border p-4">
          <h2 id="live-title" className="flex items-center gap-2 font-extrabold">
            <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
              <span className="bg-friend absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 motion-reduce:animate-none" />
              <span className="bg-friend relative inline-flex h-2.5 w-2.5 rounded-full" />
            </span>
            Live on Sippa
          </h2>
          <ul className="mt-3 space-y-1">
            {items.map((a, i) => (
              <li key={`${a.kind}-${a.character.id}-${a.at}-${i}`}>
                <Link
                  href={`/app/c/${a.character.id}`}
                  className="hover:bg-surface-2 flex items-center gap-3 rounded-lg p-2 text-sm"
                >
                  <span className="h-8 w-8 shrink-0 overflow-hidden rounded-full">
                    <CharacterAvatar
                      id={a.character.id}
                      name={a.character.name}
                      src={a.character.avatarUrl}
                      sizes="32px"
                    />
                  </span>
                  <span className="min-w-0 flex-1 truncate">
                    {a.kind === "chat" ? "New chat with " : "New character: "}
                    <span className={cn("font-bold", categoryStyles[a.character.category].ink)}>
                      {a.character.name}
                    </span>
                  </span>
                  <time dateTime={a.at} className="text-muted shrink-0 text-xs">
                    {timeAgo(a.at)}
                  </time>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!compact && (counters || rating) && (
        <div className="border-border bg-surface flex min-w-0 flex-col justify-center gap-4 rounded-xl border p-4">
          {!items.length && (
            <h2 id="live-title" className="font-extrabold">
              Sippa in numbers
            </h2>
          )}
          {counters && (
            <dl className="grid grid-cols-3 gap-2 text-center">
              {[
                { value: counters.chats, label: "chats started" },
                { value: counters.communityCharacters, label: "characters by the community" },
                { value: counters.moments, label: "moments posted" },
              ].map((s) => (
                <div key={s.label} className="flex flex-col-reverse">
                  <dt className="text-muted text-xs">{s.label}</dt>
                  <dd className="font-display text-2xl font-extrabold tracking-[-0.02em]">
                    {formatCount(s.value)}
                  </dd>
                </div>
              ))}
            </dl>
          )}
          {rating && (
            <p className="bg-primary/15 flex items-center gap-2 rounded-lg px-3 py-2 text-sm">
              <ThumbsUp className="text-primary-ink h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                <strong>{rating.percent}%</strong> of rated replies got a 👍{" "}
                <span className="text-muted">
                  · from {formatCount(rating.total)} {rating.total === 1 ? "rating" : "ratings"}
                </span>
              </span>
            </p>
          )}
        </div>
      )}
    </section>
  );
}
