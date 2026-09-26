"use client";

import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Bot,
  Brain,
  Pencil,
  Plus,
  RotateCcw,
  Square,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { addMemory, deleteMemory, newChat, type MemoryRow } from "@/app/app/chats/actions";
import type { Helpline } from "@/lib/safety/crisis";
import type { CategoryId } from "@/config/categories";
import { GIFTS, XP, type GiftSize } from "@/config/engagement";
import { cn } from "@/lib/utils";
import { ReportButton } from "../app/ReportButton";
import { BondMeter } from "../engage/BondMeter";
import { CharacterAvatar } from "../CharacterAvatar";
import { buttonClass } from "../ui/button";
import { MessageText } from "./MessageText";

export type ChatMessage = {
  id: number;
  role: "user" | "assistant" | "system";
  content: string;
  rating?: 1 | -1 | null;
  streaming?: boolean;
  /** Stable React key for messages created in this session (ids change when the server confirms them). */
  ckey?: string;
};

type Props = {
  chatId: string;
  character: { id: string; name: string; hook: string; avatarUrl?: string | null; category: CategoryId };
  bondXp: number;
  initialMessages: ChatMessage[];
  initialMemories: MemoryRow[];
  summary: string;
  remaining: number | null;
  freeLimit: number;
  helplines: Helpline[];
};

type Notice =
  | { kind: "limit"; beans: number }
  | { kind: "blocked"; text: string }
  | { kind: "error"; text: string }
  | null;

const CRISIS_MARKER = "[crisis_support]";
let tempId = -1;

export function ChatView(props: Props) {
  const { chatId, character } = props;
  const [messages, setMessages] = useState<ChatMessage[]>(props.initialMessages);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [remaining, setRemaining] = useState(props.remaining);
  const [editing, setEditing] = useState<number | null>(null);
  const [panel, setPanel] = useState(false);
  // Past the free limit, spend Beans only after the user explicitly opts in.
  const [useBeans, setUseBeans] = useState(false);
  const [bondXp, setBondXp] = useState(props.bondXp);
  const [giftOpen, setGiftOpen] = useState(false);
  const abort = useRef<AbortController | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const stick = useRef(true);
  const [showJump, setShowJump] = useState(false);
  // Wellbeing (spec §6.6): a gentle nudge after an hour in one sitting.
  const [breakHint, setBreakHint] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setBreakHint(true), 60 * 60_000);
    return () => clearTimeout(t);
  }, []);

  // Keep pinned to the bottom unless the user scrolled up to read.
  const onScroll = () => {
    const el = scroller.current;
    if (!el) return;
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    stick.current = near;
    setShowJump(!near);
  };
  const jumpToLatest = () => {
    const el = scroller.current;
    if (!el) return;
    stick.current = true;
    setShowJump(false);
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  };
  // Text grows smoothly inside bubbles, so follow size changes, not just state changes.
  useEffect(() => {
    const el = scroller.current;
    const inner = content.current;
    if (!el || !inner) return;
    el.scrollTop = el.scrollHeight;
    const ro = new ResizeObserver(() => {
      if (stick.current) el.scrollTop = el.scrollHeight;
    });
    ro.observe(inner);
    return () => ro.disconnect();
  }, []);

  const run = useCallback(async (url: string, body: object | null, optimisticUser?: ChatMessage) => {
    setBusy(true);
    setNotice(null);
    stick.current = true;
    setShowJump(false);
    const replyId = tempId--;
    setMessages((m) => [
      ...m,
      ...(optimisticUser ? [{ ...optimisticUser, ckey: `c${optimisticUser.id}` }] : []),
      { id: replyId, role: "assistant", content: "", streaming: true, ckey: `c${replyId}` },
    ]);
    const controller = new AbortController();
    abort.current = controller;

    const dropReply = () => setMessages((m) => m.filter((x) => x.id !== replyId));
    const dropUser = () => optimisticUser && setMessages((m) => m.filter((x) => x.id !== optimisticUser.id));

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
      if (!res.body) throw new Error("No response");
      if (!res.ok && !res.headers.get("content-type")?.includes("ndjson")) {
        const data = (await res.json().catch(() => ({}))) as { error?: string; needFlowers?: boolean };
        dropReply();
        dropUser();
        setNotice(
          data.needFlowers
            ? { kind: "limit", beans: 0 }
            : { kind: "error", text: data.error ?? "Something went wrong." },
        );
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const raw of lines) {
          if (!raw.trim()) continue;
          const e = JSON.parse(raw);
          if (e.t === "user" && optimisticUser) {
            setMessages((m) => m.map((x) => (x.id === optimisticUser.id ? { ...x, id: e.id } : x)));
          } else if (e.t === "d") {
            setMessages((m) => m.map((x) => (x.id === replyId ? { ...x, content: x.content + e.v } : x)));
          } else if (e.t === "done") {
            setMessages((m) => m.map((x) => (x.id === replyId ? { ...x, id: e.id, streaming: false } : x)));
            if (e.remaining !== undefined && e.remaining !== null) setRemaining(e.remaining);
            if (typeof e.xp === "number") setBondXp(e.xp);
          } else if (e.t === "crisis") {
            setMessages((m) => [
              ...m.filter((x) => x.id !== replyId),
              { id: e.systemId, role: "system", content: CRISIS_MARKER },
            ]);
          } else if (e.t === "limit") {
            dropReply();
            dropUser();
            if (optimisticUser) setInput(optimisticUser.content);
            setRemaining(0);
            setNotice({ kind: "limit", beans: e.beans ?? 0 });
          } else if (e.t === "blocked") {
            dropReply();
            dropUser();
            setNotice({ kind: "blocked", text: e.message });
          } else if (e.t === "error") {
            setMessages((m) =>
              m.flatMap((x) => (x.id === replyId ? (x.content ? [{ ...x, streaming: false }] : []) : [x])),
            );
            setNotice({ kind: "error", text: e.message });
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError")
        setNotice({ kind: "error", text: "Connection lost. Try again." });
      setMessages((m) =>
        m.flatMap((x) => (x.id === replyId ? (x.content ? [{ ...x, streaming: false }] : []) : [x])),
      );
    } finally {
      setBusy(false);
      abort.current = null;
    }
  }, []);

  const send = (e?: FormEvent) => {
    e?.preventDefault();
    const content = input.trim();
    if (!content || busy) return;
    setInput("");
    inputRef.current?.focus();
    run(`/api/chats/${chatId}/messages`, { content, useBeans }, { id: tempId--, role: "user", content });
  };

  const sendGift = (size: GiftSize) => {
    setGiftOpen(false);
    if (busy) return;
    const gift = GIFTS.find((g) => g.size === size)!;
    const text = `${gift.emoji} *gives you ${size === 5 ? "a single bloom" : size === 20 ? "a bouquet of 20 flowers" : "a grand bouquet of 50 flowers"}*`;
    run(`/api/chats/${chatId}/gift`, { size }, { id: tempId--, role: "user", content: text });
  };

  const continueWithBeans = () => {
    setUseBeans(true);
    setNotice(null);
    const content = input.trim();
    if (!content) return;
    setInput("");
    run(
      `/api/chats/${chatId}/messages`,
      { content, useBeans: true },
      { id: tempId--, role: "user", content },
    );
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send();
    }
  };

  const regenerate = () => {
    if (busy) return;
    setMessages((m) => (m.at(-1)?.role === "assistant" ? m.slice(0, -1) : m));
    run(`/api/chats/${chatId}/regenerate`, { useBeans });
  };

  const saveEdit = (content: string) => {
    const idx = messages.findIndex((m) => m.id === editing);
    setEditing(null);
    if (idx < 0 || !content.trim() || busy) return;
    setMessages((m) => m.slice(0, idx));
    run(
      `/api/chats/${chatId}/edit`,
      { content: content.trim(), useBeans },
      { id: tempId--, role: "user", content: content.trim() },
    );
  };

  const rate = async (id: number, value: 1 | -1) => {
    const current = messages.find((m) => m.id === id)?.rating ?? null;
    const next = current === value ? null : value;
    setMessages((m) => m.map((x) => (x.id === id ? { ...x, rating: next } : x)));
    await fetch(`/api/messages/${id}/rate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating: next }),
    }).catch(() => {});
  };

  const visible = messages.filter((m) => m.role !== "system" || m.content === CRISIS_MARKER);
  const lastAssistant = [...visible].reverse().find((m) => m.role === "assistant");
  const lastUser = [...visible].reverse().find((m) => m.role === "user");
  const canRegenerate =
    !busy && lastAssistant && visible.at(-1)?.id === lastAssistant.id && lastAssistant.id > 0 && !!lastUser;

  return (
    <div className="flex h-dvh min-w-0 flex-1">
      <section className="flex min-w-0 flex-1 flex-col" aria-label={`Chat with ${character.name}`}>
        {/* header */}
        <header className="border-border flex h-14 shrink-0 items-center gap-2 border-b px-2 sm:px-4">
          <Link
            href="/app/chats"
            aria-label="Back to chats"
            className="hover:bg-surface-2 rounded-lg p-2 lg:hidden"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </Link>
          <Link href={`/app/c/${character.id}`} className="flex min-w-0 items-center gap-2.5">
            <span className="h-9 w-9 shrink-0 overflow-hidden rounded-full">
              <CharacterAvatar
                id={character.id}
                name={character.name}
                src={character.avatarUrl}
                sizes="36px"
              />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold">{character.name}</span>
              <span className="text-muted flex items-center gap-1 text-[11px]">
                <Bot className="h-3 w-3" aria-hidden="true" /> AI character
              </span>
            </span>
          </Link>
          <BondMeter
            xp={bondXp}
            category={character.category}
            compact
            className="ml-2 hidden w-40 sm:block"
          />
          <div className="ml-auto flex items-center gap-1">
            <form action={newChat}>
              <input type="hidden" name="character_id" value={character.id} />
              <button
                type="submit"
                className={buttonClass({ variant: "ghost", size: "sm" })}
                title="Start a new chat"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">New chat</span>
              </button>
            </form>
            <button
              type="button"
              onClick={() => setPanel((p) => !p)}
              aria-expanded={panel}
              aria-controls="chat-panel"
              className={buttonClass({ variant: "ghost", size: "sm" })}
            >
              <Brain className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Memory</span>
            </button>
          </div>
        </header>

        {/* messages */}
        <div className="relative min-h-0 flex-1">
          <div
            ref={scroller}
            onScroll={onScroll}
            className="h-full overflow-y-auto overscroll-contain"
            aria-live="polite"
            aria-busy={busy}
          >
            <div ref={content} className="mx-auto max-w-3xl space-y-4 px-3 py-5 sm:px-6">
              <p className="text-muted bg-surface border-border mx-auto flex w-fit items-center gap-1.5 rounded-lg border px-3 py-1.5 text-center text-xs">
                <Bot className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                You&apos;re chatting with an AI character. They aren&apos;t a real person.
              </p>

              {visible.map((m) =>
                m.role === "system" ? (
                  <div key={m.ckey ?? m.id} className={cn(m.ckey && "animate-msg")}>
                    <CrisisCard lines={props.helplines} />
                  </div>
                ) : m.role === "user" ? (
                  <div
                    key={m.ckey ?? m.id}
                    className={cn("group flex flex-col items-end gap-1", m.ckey && "animate-msg")}
                  >
                    {editing === m.id ? (
                      <EditBox initial={m.content} onCancel={() => setEditing(null)} onSave={saveEdit} />
                    ) : (
                      <div className="bg-text text-bg max-w-[85%] rounded-2xl rounded-br-md px-4 py-2.5 text-[15px] leading-relaxed whitespace-pre-wrap">
                        <MessageText text={m.content} />
                      </div>
                    )}
                    {m.id === lastUser?.id && m.id > 0 && !busy && editing === null && (
                      <button
                        type="button"
                        onClick={() => setEditing(m.id)}
                        className="text-muted hover:text-text flex items-center gap-1 text-xs"
                      >
                        <Pencil className="h-3 w-3" aria-hidden="true" /> Edit
                      </button>
                    )}
                  </div>
                ) : (
                  <div key={m.ckey ?? m.id} className={cn("flex gap-2.5", m.ckey && "animate-msg")}>
                    <span className="mt-0.5 h-8 w-8 shrink-0 overflow-hidden rounded-full">
                      <CharacterAvatar
                        id={character.id}
                        name={character.name}
                        src={character.avatarUrl}
                        sizes="32px"
                      />
                    </span>
                    <div className="max-w-[85%] min-w-0">
                      <div className="bg-surface-2 rounded-2xl rounded-tl-md px-4 py-2.5 text-[15px] leading-relaxed whitespace-pre-wrap">
                        {m.streaming && !m.content ? (
                          <span className="flex gap-1 py-1.5" aria-label={`${character.name} is typing`}>
                            {[0, 1, 2].map((d) => (
                              <span
                                key={d}
                                className="bg-muted h-1.5 w-1.5 animate-bounce rounded-full"
                                style={{ animationDelay: `${d * 120}ms` }}
                              />
                            ))}
                          </span>
                        ) : m.ckey ? (
                          <SmoothText text={m.content} />
                        ) : (
                          <MessageText text={m.content} />
                        )}
                      </div>
                      {!m.streaming && m.id > 0 && (
                        <div className="text-muted mt-1 flex items-center gap-0.5">
                          <IconButton
                            label="Good reply"
                            pressed={m.rating === 1}
                            onClick={() => rate(m.id, 1)}
                          >
                            <ThumbsUp className="h-3.5 w-3.5" />
                          </IconButton>
                          <IconButton
                            label="Bad reply"
                            pressed={m.rating === -1}
                            onClick={() => rate(m.id, -1)}
                          >
                            <ThumbsDown className="h-3.5 w-3.5" />
                          </IconButton>
                          {canRegenerate && m.id === lastAssistant?.id && (
                            <IconButton label="Regenerate reply" onClick={regenerate}>
                              <RotateCcw className="h-3.5 w-3.5" />
                            </IconButton>
                          )}
                          <ReportButton targetType="message" targetId={String(m.id)} label="" />
                        </div>
                      )}
                    </div>
                  </div>
                ),
              )}

              {notice?.kind === "limit" && (
                <div role="alert" className="border-border bg-surface rounded-2xl border p-5 text-center">
                  <p className="font-extrabold">
                    You&apos;ve used today&apos;s {props.freeLimit} free messages
                  </p>
                  <p className="text-muted mt-1 text-sm">
                    They refill at midnight (UTC). Keep going with Flowers (1 per message) or get unlimited
                    chat with Sippa Plus.
                  </p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {notice.beans >= 1 ? (
                      <button type="button" onClick={continueWithBeans} className={buttonClass()}>
                        Continue with Flowers · {notice.beans} left
                      </button>
                    ) : null}
                    <Link
                      href="/app/plus"
                      className={buttonClass({ variant: notice.beans >= 1 ? "secondary" : "primary" })}
                    >
                      {notice.beans >= 1 ? "Get Plus" : "Get Flowers or Plus"}
                    </Link>
                  </div>
                </div>
              )}
              {(notice?.kind === "blocked" || notice?.kind === "error") && (
                <p role="alert" className="text-lover-ink text-center text-sm font-medium">
                  {notice.text}
                </p>
              )}
            </div>
          </div>
          {showJump && (
            <button
              type="button"
              onClick={jumpToLatest}
              className="bg-text text-bg animate-msg absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold shadow-lg"
            >
              <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
              Jump to latest
            </button>
          )}
        </div>

        {breakHint && (
          <div
            role="status"
            className="border-border bg-surface mx-3 mb-2 flex items-center gap-3 rounded-xl border px-3 py-2 text-sm sm:mx-auto sm:w-full sm:max-w-3xl"
          >
            <span className="flex-1">
              You&apos;ve been chatting for an hour — maybe stretch or grab some water? 🌿
            </span>
            <button
              type="button"
              onClick={() => setBreakHint(false)}
              className="text-muted hover:text-text text-xs font-semibold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* composer */}
        <form
          onSubmit={send}
          className="border-border shrink-0 border-t p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
        >
          <div className="border-border bg-surface focus-within:border-text mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border p-2">
            <label htmlFor="chat-input" className="sr-only">
              Message {character.name}
            </label>
            <textarea
              ref={inputRef}
              id="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKey}
              rows={1}
              maxLength={4000}
              placeholder={`Message ${character.name}…`}
              className="[field-sizing:content] max-h-40 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-[15px] focus:outline-none"
            />
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setGiftOpen((o) => !o)}
                disabled={busy}
                aria-expanded={giftOpen}
                aria-label={`Send ${character.name} flowers`}
                title="Send flowers"
                className="hover:bg-surface-2 flex h-10 w-10 items-center justify-center rounded-xl text-lg disabled:opacity-40"
              >
                <span aria-hidden="true">🌸</span>
              </button>
              {giftOpen && (
                <div className="border-border bg-bg animate-msg absolute bottom-12 left-0 z-20 w-56 rounded-xl border p-2 shadow-xl">
                  <p className="text-muted px-2 pb-1 text-[11px] font-bold tracking-[0.08em] uppercase">
                    Send a gift
                  </p>
                  {GIFTS.map((g) => (
                    <button
                      key={g.size}
                      type="button"
                      onClick={() => sendGift(g.size)}
                      className="hover:bg-surface-2 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm"
                    >
                      <span className="text-lg" aria-hidden="true">
                        {g.emoji}
                      </span>
                      <span className="flex-1 font-semibold">{g.label}</span>
                      <span className="text-muted text-xs">{g.size} 🌸</span>
                    </button>
                  ))}
                  <p className="text-muted px-2 pt-1 text-[11px]">
                    Gifts grow your bond (+{XP.perFlowerGifted} XP per flower).
                  </p>
                </div>
              )}
            </div>
            {busy ? (
              <button
                type="button"
                onClick={() => abort.current?.abort()}
                aria-label="Stop reply"
                className="bg-text text-bg flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              >
                <Square className="h-4 w-4 fill-current" aria-hidden="true" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                aria-label="Send"
                className="bg-primary text-on-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-xl disabled:opacity-40"
              >
                <ArrowUp className="h-5 w-5" aria-hidden="true" />
              </button>
            )}
          </div>
          {remaining !== null && (
            <p className="text-muted mx-auto mt-1.5 max-w-3xl text-center text-[11px]">
              {useBeans && remaining === 0
                ? "Using Flowers · 1 per message"
                : `${remaining} free message${remaining === 1 ? "" : "s"} left today`}
            </p>
          )}
        </form>
      </section>

      {panel && (
        <MemoryPanel
          chatId={chatId}
          name={character.name}
          initial={props.initialMemories}
          summary={props.summary}
          onClose={() => setPanel(false)}
        />
      )}
    </div>
  );
}

function IconButton({
  label,
  pressed,
  onClick,
  children,
}: {
  label: string;
  pressed?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      className={cn(
        "hover:bg-surface-2 hover:text-text rounded-md p-1.5",
        pressed && "text-text bg-surface-2",
      )}
    >
      {children}
    </button>
  );
}

function EditBox({
  initial,
  onSave,
  onCancel,
}: {
  initial: string;
  onSave: (v: string) => void;
  onCancel: () => void;
}) {
  const [v, setV] = useState(initial);
  return (
    <div className="border-border bg-surface w-full max-w-[85%] rounded-2xl border p-2">
      <label htmlFor="edit-last" className="sr-only">
        Edit your message
      </label>
      <textarea
        id="edit-last"
        autoFocus
        value={v}
        onChange={(e) => setV(e.target.value)}
        maxLength={4000}
        className="[field-sizing:content] w-full resize-none bg-transparent p-2 text-[15px] focus:outline-none"
      />
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className={buttonClass({ variant: "ghost", size: "sm" })}>
          Cancel
        </button>
        <button type="button" onClick={() => onSave(v)} className={buttonClass({ size: "sm" })}>
          Save &amp; resend
        </button>
      </div>
    </div>
  );
}

function CrisisCard({ lines }: { lines: Helpline[] }) {
  return (
    <div role="alert" className="border-border bg-surface mx-auto max-w-lg rounded-2xl border p-5">
      <p className="font-extrabold">We&apos;re pausing the story for a moment 💛</p>
      <p className="text-muted mt-2 text-sm leading-relaxed">
        It sounds like you might be going through something really hard. You deserve support from a real
        person — you don&apos;t have to handle this alone. If you&apos;re in danger, please call emergency
        services now.
      </p>
      <ul className="mt-3 space-y-1.5">
        {lines.map((l) => (
          <li key={l.number} className="flex items-center justify-between gap-3 text-sm">
            <span>{l.name}</span>
            {/^[\d\s]+$/.test(l.number) ? (
              <a
                href={`tel:${l.number.replace(/\s/g, "")}`}
                className="font-bold underline underline-offset-2"
              >
                {l.number}
              </a>
            ) : (
              <a
                href={`https://${l.number}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold underline underline-offset-2"
              >
                {l.number}
              </a>
            )}
          </li>
        ))}
      </ul>
      <p className="text-muted mt-3 text-xs">You can keep chatting whenever you&apos;re ready.</p>
    </div>
  );
}

function MemoryPanel({
  chatId,
  name,
  initial,
  summary,
  onClose,
}: {
  chatId: string;
  name: string;
  initial: MemoryRow[];
  summary: string;
  onClose: () => void;
}) {
  const [items, setItems] = useState(initial);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const add = async (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    const res = await addMemory(chatId, text);
    if ("error" in res) return setError(res.error);
    setItems((i) => [...i, res]);
    setText("");
    setError(null);
  };

  return (
    <aside
      id="chat-panel"
      aria-label="Memory"
      className="border-border bg-bg fixed inset-0 z-50 flex flex-col md:static md:z-auto md:w-80 md:shrink-0 md:border-l"
    >
      <div className="border-border flex h-14 items-center justify-between border-b px-4">
        <h2 className="font-extrabold">What {name} remembers</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close memory panel"
          className="hover:bg-surface-2 rounded-lg p-1.5"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      <div className="flex-1 space-y-5 overflow-y-auto p-4">
        <form onSubmit={add} className="space-y-2">
          <label htmlFor="memory-new" className="text-sm font-semibold">
            Add a memory
          </label>
          <textarea
            id="memory-new"
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={300}
            rows={2}
            placeholder="e.g. My dog is called Biscuit"
            className="border-border bg-surface focus:border-text w-full resize-none rounded-lg border p-2.5 text-sm focus:outline-none"
          />
          {error && (
            <p role="alert" className="text-lover-ink text-xs">
              {error}
            </p>
          )}
          <button type="submit" className={buttonClass({ size: "sm", className: "w-full" })}>
            Remember this
          </button>
        </form>

        <ul className="space-y-1.5">
          {items.map((m) => (
            <li key={m.id} className="bg-surface flex items-start gap-2 rounded-lg p-2.5 text-sm">
              <span className="flex-1">{m.text}</span>
              <button
                type="button"
                aria-label={`Forget: ${m.text}`}
                onClick={async () => {
                  const r = await deleteMemory(m.id);
                  if (r.ok) setItems((i) => i.filter((x) => x.id !== m.id));
                }}
                className="text-muted hover:text-text p-0.5"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </li>
          ))}
          {!items.length && <li className="text-muted text-xs">No memories yet.</li>}
        </ul>

        {summary && (
          <div>
            <h3 className="text-muted text-xs font-bold tracking-[0.08em] uppercase">Story so far</h3>
            <p className="text-muted mt-1.5 text-sm leading-relaxed">{summary}</p>
          </div>
        )}
      </div>
    </aside>
  );
}

/**
 * Reveals streamed text at a steady pace instead of in network-sized bursts.
 * Catches up faster when it falls behind; instant for reduced-motion users.
 */
function SmoothText({ text }: { text: string }) {
  const [shown, setShown] = useState(0);
  const shownRef = useRef(0);
  const target = useRef(text);
  target.current = text;

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      shownRef.current = text.length;
      setShown(text.length);
      return;
    }
    let raf = 0;
    const tick = () => {
      const gap = target.current.length - shownRef.current;
      if (gap <= 0) return; // caught up — stop until more text arrives
      shownRef.current += Math.max(1, Math.ceil(gap / 8));
      setShown(shownRef.current);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [text]);

  return <MessageText text={text.slice(0, shown)} />;
}
