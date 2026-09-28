"use client";

import { Heart, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toggleMomentLike } from "@/app/app/moments/actions";
import type { Moment } from "@/lib/moments";
import { cn, timeAgo } from "@/lib/utils";
import { CharacterAvatar } from "../CharacterAvatar";
import { MessageText } from "../chat/MessageText";

const SIGNUP = "/signup?next=/app/moments";
const actionCls =
  "hover:bg-surface-2 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold disabled:opacity-60";

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
    if (data?.chatId) {
      router.refresh(); // the chat just changed: don't reuse a cached copy of it
      return router.push(`/app/chats/${data.chatId}`);
    }
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
          <p className="text-muted text-xs">AI · {timeAgo(moment.createdAt)}</p>
        </div>
      </header>
      <p className="mt-3 text-[15px] leading-relaxed whitespace-pre-wrap">
        <MessageText text={moment.text} />
      </p>
      <LikedBy characters={moment.reactions.likedBy} />
      <div className="mt-3 flex items-center gap-1">
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
            {count === 0 && !liked && <span className="text-muted ml-1 text-xs">Be the first to like</span>}
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
      <CharacterReplies replies={moment.reactions.replies} />
      {error && (
        <p role="alert" className="text-lover-ink mt-2 text-sm font-medium">
          {error}
        </p>
      )}
    </article>
  );
}

type Reactions = Moment["reactions"];

/** "Liked by Leonardo da Vinci and 2 other characters" — AI characters, separate from real likes. */
function LikedBy({ characters }: { characters: Reactions["likedBy"] }) {
  if (!characters.length) return null;
  const [first, ...rest] = characters;
  return (
    <p className="text-muted mt-3 flex items-center gap-2 text-xs">
      <span className="flex -space-x-1.5" aria-hidden="true">
        {characters.slice(0, 3).map((c) => (
          <span key={c.id} className="ring-surface h-5 w-5 overflow-hidden rounded-full ring-2">
            <CharacterAvatar id={c.id} name={c.name} src={c.avatarUrl} sizes="20px" />
          </span>
        ))}
      </span>
      <span>
        Liked by{" "}
        <Link href={`/app/c/${first.id}`} className="text-text font-semibold hover:underline">
          {first.name}
        </Link>
        {rest.length > 0 && ` and ${rest.length} other character${rest.length === 1 ? "" : "s"}`}
      </span>
    </p>
  );
}

/** Short public replies from other characters, each clearly marked as AI. */
function CharacterReplies({ replies }: { replies: Reactions["replies"] }) {
  if (!replies.length) return null;
  return (
    <ul className="border-border mt-3 space-y-3 border-t pt-3" aria-label="Replies from other characters">
      {replies.map((r) => (
        <li key={r.id} className="flex gap-2.5">
          <Link href={`/app/c/${r.character.id}`} className="h-7 w-7 shrink-0 overflow-hidden rounded-full">
            <CharacterAvatar
              id={r.character.id}
              name={r.character.name}
              src={r.character.avatarUrl}
              sizes="28px"
            />
          </Link>
          <div className="bg-surface-2 min-w-0 flex-1 rounded-xl px-3 py-2">
            <p className="text-xs">
              <Link href={`/app/c/${r.character.id}`} className="font-bold hover:underline">
                {r.character.name}
              </Link>{" "}
              <span className="text-muted">AI · {timeAgo(r.createdAt)}</span>
            </p>
            <p className="mt-0.5 text-sm leading-relaxed">
              <MessageText text={r.text} />
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
