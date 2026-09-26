"use client";

import { X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CharacterAvatar } from "../CharacterAvatar";
import { MessageText } from "../chat/MessageText";

type Nudge = { id: string; characterId: string; name: string; avatarUrl: string | null; text: string };

const MIN_MS = 180_000; // 3 minutes
const MAX_MS = 240_000; // 4 minutes
const VISIBLE_MS = 25_000;

/** Every 3–4 minutes a character from your chats writes to you (can be turned off in Settings). */
export function NudgePopup() {
  const pathname = usePathname();
  const router = useRouter();
  const [nudge, setNudge] = useState<Nudge | null>(null);
  const [opening, setOpening] = useState(false);
  const path = useRef(pathname);
  path.current = pathname;

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let cancelled = false;
    const schedule = () => {
      timer = setTimeout(fire, MIN_MS + Math.random() * (MAX_MS - MIN_MS));
    };
    const fire = async () => {
      if (cancelled) return;
      if (document.visibilityState !== "visible") return schedule();
      const chatMatch = /^\/app\/chats\/([0-9a-f-]{36})$/.exec(path.current);
      try {
        const res = await fetch("/api/nudge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(chatMatch ? { excludeChatId: chatMatch[1] } : {}),
        });
        if (res.status === 200 && !cancelled) setNudge((await res.json()) as Nudge);
      } catch {
        // offline — try again next round
      }
      schedule();
    };
    schedule();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (!nudge) return;
    const t = setTimeout(() => setNudge(null), VISIBLE_MS);
    return () => clearTimeout(t);
  }, [nudge]);

  if (!nudge) return null;

  const reply = async () => {
    setOpening(true);
    try {
      const res = await fetch(`/api/nudge/${nudge.id}/reply`, { method: "POST" });
      const data = (await res.json()) as { chatId?: string };
      setNudge(null);
      if (data.chatId) router.push(`/app/chats/${data.chatId}`);
    } finally {
      setOpening(false);
    }
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="animate-msg border-border bg-bg fixed inset-x-3 top-3 z-50 mx-auto max-w-sm rounded-2xl border p-3 shadow-2xl md:inset-x-auto md:top-auto md:right-5 md:bottom-5"
    >
      <div className="flex gap-3">
        <span className="h-11 w-11 shrink-0 overflow-hidden rounded-full">
          <CharacterAvatar id={nudge.characterId} name={nudge.name} src={nudge.avatarUrl} sizes="44px" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center justify-between gap-2 text-sm font-bold">
            {nudge.name}
            <span className="text-muted text-[10px] font-semibold">AI · now</span>
          </p>
          <p className="mt-0.5 line-clamp-3 text-sm leading-snug">
            <MessageText text={nudge.text} />
          </p>
          <div className="mt-2.5 flex gap-2">
            <button
              type="button"
              onClick={reply}
              disabled={opening}
              className="bg-primary rounded-lg px-3 py-1.5 text-xs font-bold text-black disabled:opacity-60"
            >
              {opening ? "Opening…" : "Reply"}
            </button>
            <button
              type="button"
              onClick={() => setNudge(null)}
              className="text-muted hover:text-text rounded-lg px-2 text-xs font-semibold"
            >
              Later
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setNudge(null)}
          aria-label="Close"
          className="text-muted hover:text-text self-start p-0.5"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
