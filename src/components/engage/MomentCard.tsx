"use client";

import { Heart, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toggleMomentLike } from "@/app/app/moments/actions";
import type { Moment } from "@/lib/moments";
import { cn } from "@/lib/utils";
import { CharacterAvatar } from "../CharacterAvatar";
import { MessageText } from "../chat/MessageText";

const SIGNUP = "/signup?next=/app/moments";
const actionCls =
  "hover:bg-surface-2 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold disabled:opacity-60";

function ago(iso: string) {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (m < 60) return `${Math.max(1, m)}m`;
  if (m < 1440) return `${Math.round(m / 60)}h`;
  return `${Math.round(m / 1440)}d`;
}

export function MomentCard({ moment, signedIn }: { moment: Moment; signedIn: boolean }) {
  const router = useRouter();
  const [liked, setLiked] = useState(moment.liked);
  const [count, setCount] = useState(moment.likeCount);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const like = async () => {
    setLiked(!liked);
    setCount((c) => c + (liked ? -1 : 1));
    const now = await toggleMomentLike(moment.id, liked);
    setLiked(now);
  };
  const reply = async () => {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/moments/${moment.id}/reply`, { method: "POST" }).catch(() => null);
    const data = await res?.json().catch(() => ({}));
    if (data?.chatId) return router.push(`/app/chats/${data.chatId}`);
    setBusy(false);
    setError(data?.error ?? "Couldn't open the chat. Try again.");
  };

  return (
    <article className="border-border bg-surface rounded-2xl border p-4">
      <header className="flex items-center gap-3">
        <Link
          href={`/app/c/${moment.character.id}`}
          className="h-10 w-10 shrink-0 overflow-hidden rounded-full"
        >
          <CharacterAvatar
            id={moment.character.id}
            name={moment.character.name}
            src={moment.character.avatarUrl}
            sizes="40px"
          />
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            href={`/app/c/${moment.character.id}`}
            className="block truncate text-sm font-bold hover:underline"
          >
            {moment.character.name}
          </Link>
          <p className="text-muted text-xs">AI · {ago(moment.createdAt)}</p>
        </div>
      </header>
      <p className="mt-3 text-[15px] leading-relaxed whitespace-pre-wrap">
        <MessageText text={moment.text} />
      </p>
      <div className="mt-3 flex gap-1">
        {signedIn ? (
          <>
            <button
              type="button"
              onClick={like}
              aria-pressed={liked}
              className={cn(actionCls, liked && "text-lover-ink")}
            >
              <Heart className={cn("h-4 w-4", liked && "fill-current")} aria-hidden="true" />
              {count > 0 ? count : "Like"}
            </button>
            <button type="button" onClick={reply} disabled={busy} className={actionCls}>
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              {busy ? "Opening…" : "Reply"}
            </button>
          </>
        ) : (
          // Visitors get plain links: they work before the page's JavaScript has loaded.
          <>
            <Link href={SIGNUP} className={actionCls}>
              <Heart className="h-4 w-4" aria-hidden="true" />
              {count > 0 ? count : "Like"}
            </Link>
            <Link href={SIGNUP} className={actionCls}>
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              Reply
            </Link>
          </>
        )}
      </div>
      {error && (
        <p role="alert" className="text-lover-ink mt-2 text-sm font-medium">
          {error}
        </p>
      )}
    </article>
  );
}
