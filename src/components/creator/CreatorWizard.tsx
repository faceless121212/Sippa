"use client";

import { ArrowLeft, ArrowUp, Bot, Check, Coffee, ImageIcon, RotateCcw, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { categories, categoryStyles, type CategoryId } from "@/config/categories";
import { beanCosts } from "@/config/site";
import { QUIZ, type Dials, type Draft } from "@/lib/creator/schema";
import type { Helpline } from "@/lib/safety/crisis";
import { cn } from "@/lib/utils";
import { CharacterCard } from "../CharacterCard";
import { MessageText } from "../chat/MessageText";
import { buttonClass } from "../ui/button";

type Step = "category" | "describe" | "brewing" | "tune";
type FamousType = "historical" | "inspired";

const EXAMPLES: Record<CategoryId, string[]> = {
  lover: [
    "a grumpy lighthouse keeper who secretly writes poetry",
    "my rival at the office who keeps leaving coffee on my desk",
    "a charming violinist I met on a night train to Vienna",
  ],
  friend: [
    "a chaotic gamer who hypes me up before exams",
    "a retired sea captain with a story for every problem",
    "a calm yoga teacher who's secretly hilarious",
  ],
  famous: [
    "Marie Curie",
    "a Renaissance inventor amazed by smartphones",
    "Cleopatra as my negotiation coach",
  ],
};

const REGEN_LABEL = "Regenerate";

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok)
    throw Object.assign(new Error(data.error ?? "Something went wrong."), { paywall: Boolean(data.paywall) });
  return data as T;
}

export function CreatorWizard({
  initialCategory,
  adult,
  creationsLeft,
  beans,
  helplines,
}: {
  initialCategory?: CategoryId;
  adult: boolean;
  creationsLeft: number | null;
  beans: number;
  helplines: Helpline[];
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(initialCategory ? "describe" : "category");
  const [category, setCategory] = useState<CategoryId>(initialCategory ?? "friend");
  const [famousType, setFamousType] = useState<FamousType>("historical");
  const [mode, setMode] = useState<"text" | "quiz">("text");
  const [text, setText] = useState("");
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [draft, setDraft] = useState<Draft | null>(null);
  const [avatars, setAvatars] = useState<string[]>([]);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [avatarsBusy, setAvatarsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paywall, setPaywall] = useState(false);

  const visible = categories.filter((c) => adult || !c.adultsOnly);

  const loadAvatars = async (d: Draft) => {
    setAvatarsBusy(true);
    try {
      const { urls } = await postJson<{ urls: string[] }>("/api/creator/avatars", { draft: d });
      setAvatars(urls);
      setAvatar(urls[0] ?? null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setAvatarsBusy(false);
    }
  };

  const brew = async (e?: FormEvent) => {
    e?.preventDefault();
    setError(null);
    setStep("brewing");
    try {
      const { draft: d } = await postJson<{ draft: Draft }>("/api/creator/generate", {
        category,
        ...(mode === "text" ? { text } : { answers }),
        ...(category === "famous" ? { famousType } : {}),
      });
      setDraft(d);
      setAvatars([]);
      setAvatar(null);
      setStep("tune");
      loadAvatars(d);
    } catch (err) {
      setError((err as Error).message);
      setPaywall(Boolean((err as { paywall?: boolean }).paywall));
      setStep("describe");
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 md:py-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-muted text-xs font-bold tracking-[0.08em] uppercase">AI Character Creator</p>
          <h1 className="text-3xl font-extrabold tracking-[-0.03em]">
            {step === "tune" ? "Make it yours" : "Brew a character"}
          </h1>
        </div>
        {creationsLeft !== null && (
          <span className="bg-surface-2 rounded-lg px-2.5 py-1 text-xs font-semibold">
            {creationsLeft > 0
              ? `${creationsLeft} free creation${creationsLeft === 1 ? "" : "s"} left`
              : `${beanCosts.creation} Flowers per creation · you have ${beans}`}
          </span>
        )}
      </div>

      <Stepper step={step} />

      {error && (
        <div role="alert" className="border-border bg-surface mt-5 rounded-xl border p-4 text-sm">
          <p className="font-semibold">{error}</p>
          {paywall && (
            <a href="/app/plus" className={buttonClass({ size: "sm", className: "mt-3" })}>
              Get Flowers or Plus
            </a>
          )}
        </div>
      )}

      {step === "category" && (
        <section aria-labelledby="step-cat" className="mt-6">
          <h2 id="step-cat" className="text-lg font-extrabold">
            1. Pick a category
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {visible.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setCategory(c.id);
                  setStep("describe");
                }}
                className="border-border bg-bg hover:bg-surface rounded-xl border p-5 text-left transition-colors"
              >
                <span className="flex items-center gap-2">
                  <span
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-lg text-lg",
                      categoryStyles[c.id].softBg,
                    )}
                    aria-hidden="true"
                  >
                    {c.emoji}
                  </span>
                  <span className={cn("text-xl font-bold", categoryStyles[c.id].ink)}>{c.label}</span>
                  {c.adultsOnly && <span className="text-muted ml-auto text-[11px] font-medium">18+</span>}
                </span>
                <span className="text-muted mt-2 block text-sm">{c.blurb}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {step === "describe" && (
        <section aria-labelledby="step-desc" className="mt-6 max-w-2xl">
          <button
            type="button"
            onClick={() => setStep("category")}
            className="text-muted hover:text-text mb-3 flex items-center gap-1 text-sm"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {categories.find((c) => c.id === category)!.label}
          </button>
          <h2 id="step-desc" className="text-lg font-extrabold">
            2. Describe them — or take the quiz
          </h2>

          {category === "famous" && (
            <fieldset className="mt-4">
              <legend className="text-sm font-semibold">What kind?</legend>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                <Choice
                  active={famousType === "historical"}
                  onClick={() => setFamousType("historical")}
                  title="Historical figure"
                  body="Real, died 70+ years ago"
                />
                <Choice
                  active={famousType === "inspired"}
                  onClick={() => setFamousType("inspired")}
                  title="Inspired-by"
                  body="Fictional archetype"
                />
                <div className="border-border text-muted rounded-xl border border-dashed p-3 text-left text-sm opacity-60">
                  <span className="block font-semibold">Verified creator</span>
                  <span className="text-xs">Coming soon</span>
                </div>
              </div>
              <p className="text-muted mt-2 text-xs">No living celebrities or real people — ever.</p>
            </fieldset>
          )}

          <div
            role="tablist"
            aria-label="How to describe"
            className="bg-surface-2 mt-5 inline-flex rounded-lg p-0.5"
          >
            {(["text", "quiz"] as const).map((m) => (
              <button
                key={m}
                role="tab"
                type="button"
                aria-selected={mode === m}
                onClick={() => setMode(m)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-semibold",
                  mode === m ? "bg-bg shadow-sm" : "text-muted",
                )}
              >
                {m === "text" ? "Describe" : "Quick quiz"}
              </button>
            ))}
          </div>

          <form onSubmit={brew} className="mt-4 space-y-4">
            {mode === "text" ? (
              <div>
                <label htmlFor="idea" className="sr-only">
                  Describe your character
                </label>
                <textarea
                  id="idea"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={3}
                  maxLength={400}
                  placeholder={`e.g. ${EXAMPLES[category][0]}`}
                  className="border-border bg-surface focus:border-text w-full resize-none rounded-xl border p-4 text-base focus:outline-none"
                />
                <ul className="mt-2 flex flex-wrap gap-2">
                  {EXAMPLES[category].map((ex) => (
                    <li key={ex}>
                      <button
                        type="button"
                        onClick={() => setText(ex)}
                        className="border-border text-muted hover:text-text hover:bg-surface rounded-md border px-2.5 py-1 text-xs"
                      >
                        {ex}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="space-y-4">
                {QUIZ[category].map((q) => (
                  <fieldset key={q.id}>
                    <legend className="text-sm font-semibold">
                      {q.label} {q.multi && <span className="text-muted font-normal">(pick up to 3)</span>}
                    </legend>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {q.options.map((o) => {
                        const on = (answers[q.id] ?? []).includes(o);
                        return (
                          <button
                            key={o}
                            type="button"
                            aria-pressed={on}
                            onClick={() =>
                              setAnswers((a) => {
                                const cur = a[q.id] ?? [];
                                const next = on
                                  ? cur.filter((x) => x !== o)
                                  : q.multi
                                    ? [...cur, o].slice(-3)
                                    : [o];
                                return { ...a, [q.id]: next };
                              })
                            }
                            className={cn(
                              "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                              on ? "border-text bg-text text-bg" : "border-border hover:bg-surface",
                            )}
                          >
                            {o}
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>
                ))}
              </div>
            )}
            <button
              type="submit"
              disabled={
                mode === "text" ? text.trim().length < 3 : Object.values(answers).every((a) => !a.length)
              }
              className={buttonClass({ size: "lg", className: "w-full sm:w-auto" })}
            >
              <Coffee className="h-4 w-4" aria-hidden="true" />
              Brew my character
            </button>
          </form>
        </section>
      )}

      {step === "brewing" && <Brewing />}

      {step === "tune" && draft && (
        <TuneStep
          draft={draft}
          setDraft={setDraft}
          avatars={avatars}
          avatar={avatar}
          setAvatar={setAvatar}
          avatarsBusy={avatarsBusy}
          reloadAvatars={() => loadAvatars(draft)}
          onRestart={() => {
            setStep("describe");
            setDraft(null);
          }}
          onSaved={(id) => router.push(`/app/c/${id}`)}
          helplines={helplines}
        />
      )}
    </div>
  );
}

function Stepper({ step }: { step: Step }) {
  const steps = ["Category", "Describe", "Brew", "Tune & test", "Save"];
  const current = step === "category" ? 0 : step === "describe" ? 1 : step === "brewing" ? 2 : 3;
  return (
    <ol className="no-scrollbar mt-5 flex gap-2 overflow-x-auto" aria-label="Steps">
      {steps.map((s, i) => (
        <li
          key={s}
          aria-current={i === current ? "step" : undefined}
          className={cn(
            "flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold",
            i === current ? "bg-text text-bg" : i < current ? "bg-surface-2" : "text-muted",
          )}
        >
          {i < current ? <Check className="h-3 w-3" aria-hidden="true" /> : <span>{i + 1}</span>}
          {s}
        </li>
      ))}
    </ol>
  );
}

function Choice({
  active,
  onClick,
  title,
  body,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  body: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "rounded-xl border p-3 text-left text-sm",
        active ? "border-text shadow-[0_0_0_1px_var(--text)]" : "border-border hover:bg-surface",
      )}
    >
      <span className="block font-semibold">{title}</span>
      <span className="text-muted text-xs">{body}</span>
    </button>
  );
}

function Brewing() {
  return (
    <div role="status" className="mt-16 flex flex-col items-center text-center">
      <div className="flex h-12 items-end gap-2.5" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="bg-muted animate-steam block h-2 w-1.5 rounded-full"
            style={{ animationDelay: `${i * 200}ms` }}
          />
        ))}
      </div>
      <svg viewBox="0 0 120 70" className="w-24" aria-hidden="true">
        <path d="M10 6 h86 v26 a30 30 0 0 1 -30 30 h-26 a30 30 0 0 1 -30 -30 z" fill="var(--text)" />
        <path d="M96 14 h6 a12 12 0 0 1 0 24 h-8" stroke="var(--text)" strokeWidth="7" fill="none" />
        <rect x="16" y="12" width="74" height="30" rx="4" fill="var(--primary)" className="animate-pulse" />
      </svg>
      <p className="mt-6 text-lg font-extrabold">Brewing your character…</p>
      <p className="text-muted mt-1 text-sm">
        Name, personality, backstory and a first message. ~10 seconds.
      </p>
    </div>
  );
}

// ───────────── tune + test + save ─────────────

type TuneProps = {
  draft: Draft;
  setDraft: (d: Draft) => void;
  avatars: string[];
  avatar: string | null;
  setAvatar: (a: string) => void;
  avatarsBusy: boolean;
  reloadAvatars: () => void;
  onRestart: () => void;
  onSaved: (id: string) => void;
  helplines: Helpline[];
};

function TuneStep(props: TuneProps) {
  const { draft, setDraft } = props;
  const [busyField, setBusyField] = useState<string | null>(null);
  const [tab, setTab] = useState<"edit" | "test">("edit");
  const [visibility, setVisibility] = useState<"private" | "unlisted" | "public">("private");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft({ ...draft, [k]: v });

  const regen = async (
    field:
      | "name"
      | "hook"
      | "description"
      | "speakingStyle"
      | "backstory"
      | "firstMessage"
      | "traits"
      | "exampleDialogues",
  ) => {
    setBusyField(field);
    try {
      const { value } = await postJson<{ value: never }>("/api/creator/field", { draft, field });
      setDraft({ ...draft, [field]: value });
    } catch (e) {
      setSaveError((e as Error).message);
    } finally {
      setBusyField(null);
    }
  };

  const save = async () => {
    if (!props.avatar) return setSaveError("Pick a portrait first.");
    setSaving(true);
    setSaveError(null);
    try {
      const { id } = await postJson<{ id: string }>("/api/creator/save", {
        draft,
        avatarUrl: props.avatar,
        visibility,
      });
      props.onSaved(id);
    } catch (e) {
      setSaveError((e as Error).message);
      setSaving(false);
    }
  };

  const card = {
    id: "draft",
    name: draft.name,
    age: draft.age ?? undefined,
    category: draft.category,
    hook: draft.hook,
    tags: draft.tags,
    messages: 0,
    avatarUrl: props.avatar,
  };

  return (
    <div className="mt-6">
      <div
        role="tablist"
        aria-label="Tune or test"
        className="bg-surface-2 mb-4 inline-flex rounded-lg p-0.5 lg:hidden"
      >
        {(["edit", "test"] as const).map((t) => (
          <button
            key={t}
            role="tab"
            type="button"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-semibold",
              tab === t ? "bg-bg shadow-sm" : "text-muted",
            )}
          >
            {t === "edit" ? "Edit" : "Test chat"}
          </button>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className={cn("space-y-6", tab !== "edit" && "hidden lg:block")}>
          {/* portraits */}
          <section aria-labelledby="portraits">
            <div className="flex items-center justify-between">
              <h2 id="portraits" className="text-sm font-extrabold">
                Portrait
              </h2>
              <button
                type="button"
                onClick={props.reloadAvatars}
                disabled={props.avatarsBusy}
                className="text-muted hover:text-text flex items-center gap-1 text-xs font-semibold disabled:opacity-50"
              >
                <ImageIcon className="h-3.5 w-3.5" aria-hidden="true" /> New portraits
              </button>
            </div>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {props.avatarsBusy && !props.avatars.length
                ? [0, 1, 2, 3].map((i) => (
                    <div key={i} className="bg-surface-2 aspect-[3/4] animate-pulse rounded-lg" />
                  ))
                : props.avatars.map((url, i) => (
                    <button
                      key={url}
                      type="button"
                      onClick={() => props.setAvatar(url)}
                      aria-pressed={props.avatar === url}
                      aria-label={`Portrait option ${i + 1}`}
                      className={cn(
                        "relative aspect-[3/4] overflow-hidden rounded-lg ring-offset-2 ring-offset-[var(--bg)]",
                        props.avatar === url && "ring-text ring-2",
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element -- temporary provider URLs */}
                      <img
                        src={url}
                        alt=""
                        className={cn("h-full w-full object-cover", props.avatarsBusy && "opacity-50")}
                      />
                    </button>
                  ))}
            </div>
            <Field label="Look (used for portraits)">
              <textarea
                value={draft.visualPrompt}
                maxLength={500}
                rows={2}
                onChange={(e) => set("visualPrompt", e.target.value)}
                className={inputCls}
              />
            </Field>
          </section>

          <section aria-labelledby="basics" className="grid gap-4 sm:grid-cols-[1fr_120px_140px]">
            <h2 id="basics" className="sr-only">
              Basics
            </h2>
            <Field label="Name" onRegen={() => regen("name")} busy={busyField === "name"}>
              <input
                value={draft.name}
                maxLength={60}
                onChange={(e) => set("name", e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label={draft.category === "lover" ? "Age (21+)" : "Age"}>
              <input
                type="number"
                min={draft.category === "lover" ? 21 : 18}
                max={120}
                value={draft.age ?? ""}
                placeholder={draft.category === "famous" ? "—" : ""}
                onChange={(e) => set("age", e.target.value ? Number(e.target.value) : null)}
                className={inputCls}
              />
            </Field>
            <Field label="Gender">
              <select
                value={draft.gender}
                onChange={(e) => set("gender", e.target.value as Draft["gender"])}
                className={inputCls}
              >
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="nonbinary">Non-binary</option>
              </select>
            </Field>
          </section>

          <Field label="Hook (one line)" onRegen={() => regen("hook")} busy={busyField === "hook"}>
            <input
              value={draft.hook}
              maxLength={90}
              onChange={(e) => set("hook", e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Description" onRegen={() => regen("description")} busy={busyField === "description"}>
            <textarea
              value={draft.description}
              maxLength={600}
              rows={2}
              onChange={(e) => set("description", e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field
            label="Personality (comma-separated)"
            onRegen={() => regen("traits")}
            busy={busyField === "traits"}
          >
            <input
              value={draft.traits.join(", ")}
              onChange={(e) =>
                set(
                  "traits",
                  e.target.value
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean)
                    .slice(0, 6),
                )
              }
              className={inputCls}
            />
          </Field>
          <Field
            label="Speaking style"
            onRegen={() => regen("speakingStyle")}
            busy={busyField === "speakingStyle"}
          >
            <input
              value={draft.speakingStyle}
              maxLength={300}
              onChange={(e) => set("speakingStyle", e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Backstory" onRegen={() => regen("backstory")} busy={busyField === "backstory"}>
            <textarea
              value={draft.backstory}
              maxLength={1000}
              rows={3}
              onChange={(e) => set("backstory", e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field
            label="First message"
            onRegen={() => regen("firstMessage")}
            busy={busyField === "firstMessage"}
          >
            <textarea
              value={draft.firstMessage}
              maxLength={500}
              rows={2}
              onChange={(e) => set("firstMessage", e.target.value)}
              className={inputCls}
            />
          </Field>

          <Dials draft={draft} onChange={(d) => set("dials", d)} />

          {/* save */}
          <section aria-labelledby="publish" className="border-border rounded-xl border p-4">
            <h2 id="publish" className="text-sm font-extrabold">
              Who can chat with them?
            </h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <Choice
                active={visibility === "private"}
                onClick={() => setVisibility("private")}
                title="Private"
                body="Only you"
              />
              <Choice
                active={visibility === "unlisted"}
                onClick={() => setVisibility("unlisted")}
                title="Unlisted"
                body="Anyone with the link"
              />
              <Choice
                active={visibility === "public"}
                onClick={() => setVisibility("public")}
                title="Public"
                body="In Explore after review"
              />
            </div>
            {saveError && (
              <p role="alert" className="text-lover-ink mt-3 text-sm font-medium">
                {saveError}
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={save}
                disabled={saving || !props.avatar}
                className={buttonClass({ size: "lg" })}
              >
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                {saving ? "Checking & saving…" : "Save character"}
              </button>
              <button
                type="button"
                onClick={props.onRestart}
                className={buttonClass({ variant: "ghost", size: "lg" })}
              >
                Start over
              </button>
            </div>
            <p className="text-muted mt-2 text-xs">
              Every character gets an automatic safety review before it&apos;s saved.
            </p>
          </section>
        </div>

        <aside
          className={cn("space-y-4 lg:sticky lg:top-6 lg:self-start", tab !== "test" && "hidden lg:block")}
          aria-label="Preview"
        >
          <div className="mx-auto w-48">
            <CharacterCard character={card} />
          </div>
          <PreviewChat draft={draft} helplines={props.helplines} />
        </aside>
      </div>
    </div>
  );
}

const inputCls =
  "border-border bg-surface focus:border-text w-full rounded-lg border px-3 py-2 text-sm focus:outline-none";

function Field({
  label,
  children,
  onRegen,
  busy,
}: {
  label: string;
  children: ReactNode;
  onRegen?: () => void;
  busy?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center justify-between gap-2 text-xs font-semibold">
        {label}
        {onRegen && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onRegen();
            }}
            disabled={busy}
            className="text-muted hover:text-text flex items-center gap-1 font-semibold disabled:opacity-50"
            aria-label={`${REGEN_LABEL} ${label.toLowerCase()}`}
          >
            <RotateCcw className={cn("h-3 w-3", busy && "animate-spin")} aria-hidden="true" />
            {busy ? "Brewing…" : REGEN_LABEL}
          </button>
        )}
      </span>
      {children}
    </label>
  );
}

function Dials({ draft, onChange }: { draft: Draft; onChange: (d: Dials) => void }) {
  const items: { key: keyof Dials; label: string }[] = [
    { key: "warmth", label: "Warmth" },
    { key: "humor", label: "Humour" },
    { key: "talkativeness", label: "Talkativeness" },
    ...(draft.category === "lover" ? [{ key: "flirtiness" as const, label: "Flirtiness" }] : []),
  ];
  return (
    <fieldset className="grid gap-4 sm:grid-cols-2">
      <legend className="mb-2 text-sm font-extrabold">Personality dials</legend>
      {items.map(({ key, label }) => (
        <label key={key} className="block text-xs font-semibold">
          <span className="flex justify-between">
            {label} <span className="text-muted">{draft.dials[key]}</span>
          </span>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={draft.dials[key]}
            onChange={(e) => onChange({ ...draft.dials, [key]: Number(e.target.value) })}
            className="mt-1 w-full accent-[var(--text)]"
          />
        </label>
      ))}
    </fieldset>
  );
}

type PMsg = { role: "user" | "assistant"; content: string };

function PreviewChat({ draft, helplines }: { draft: Draft; helplines: Helpline[] }) {
  const [msgs, setMsgs] = useState<PMsg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [crisis, setCrisis] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const full = msgs.length >= 12;

  const send = async (e: FormEvent) => {
    e.preventDefault();
    const content = input.trim();
    if (!content || busy || full) return;
    setInput("");
    setNote(null);
    const history: PMsg[] = [...msgs, { role: "user", content }];
    setMsgs([...history, { role: "assistant", content: "" }]);
    setBusy(true);
    try {
      const res = await fetch("/api/creator/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft, messages: history }),
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Preview unavailable.");
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const raw of lines) {
          if (!raw.trim()) continue;
          const ev = JSON.parse(raw);
          if (ev.t === "d")
            setMsgs((m) => [...m.slice(0, -1), { role: "assistant", content: m.at(-1)!.content + ev.v }]);
          else if (ev.t === "crisis") {
            setCrisis(true);
            setMsgs((m) => m.slice(0, -1));
          } else if (ev.t === "limit") {
            setMsgs((m) => m.slice(0, -2));
            setNote("You've used today's free messages.");
          } else if (ev.t === "blocked" || ev.t === "error") {
            setMsgs((m) => m.slice(0, -1));
            setNote(ev.message);
          }
        }
        if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight;
      }
    } catch (err) {
      setMsgs((m) => m.slice(0, -1));
      setNote((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section
      aria-labelledby="test-chat"
      className="border-border bg-surface flex h-[420px] flex-col rounded-xl border"
    >
      <div className="border-border flex items-center justify-between border-b px-3 py-2">
        <h2 id="test-chat" className="text-sm font-extrabold">
          Test chat
        </h2>
        <span className="text-muted flex items-center gap-1 text-[11px]">
          <Bot className="h-3 w-3" aria-hidden="true" /> AI · not saved
        </span>
      </div>
      <div ref={scroller} className="flex-1 space-y-2 overflow-y-auto p-3 text-sm" aria-live="polite">
        <Bubble role="assistant" text={draft.firstMessage} />
        {msgs.map((m, i) => (
          <Bubble
            key={i}
            role={m.role}
            text={m.content}
            typing={busy && i === msgs.length - 1 && !m.content}
          />
        ))}
        {crisis && (
          <div role="alert" className="border-border bg-bg rounded-lg border p-3 text-xs">
            <p className="font-bold">You don&apos;t have to go through this alone 💛</p>
            <ul className="mt-1 space-y-0.5">
              {helplines.map((l) => (
                <li key={l.number}>
                  {l.name}: <strong>{l.number}</strong>
                </li>
              ))}
            </ul>
          </div>
        )}
        {note && <p className="text-muted text-center text-xs">{note}</p>}
      </div>
      <form onSubmit={send} className="border-border flex gap-2 border-t p-2">
        <label htmlFor="preview-input" className="sr-only">
          Message {draft.name}
        </label>
        <input
          id="preview-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={2000}
          disabled={full}
          placeholder={full ? "Preview limit reached — save to keep chatting" : `Say hi to ${draft.name}…`}
          className="bg-bg border-border focus:border-text min-w-0 flex-1 rounded-lg border px-3 text-sm focus:outline-none"
        />
        <button
          type="submit"
          disabled={busy || !input.trim() || full}
          aria-label="Send"
          className="bg-primary text-on-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-lg disabled:opacity-40"
        >
          <ArrowUp className="h-4 w-4" aria-hidden="true" />
        </button>
      </form>
    </section>
  );
}

function Bubble({ role, text, typing }: { role: "user" | "assistant"; text: string; typing?: boolean }) {
  return (
    <div className={cn("flex", role === "user" && "justify-end")}>
      <div
        className={cn(
          "max-w-[85%] rounded-xl px-3 py-2 leading-relaxed whitespace-pre-wrap",
          role === "user" ? "bg-text text-bg rounded-br-sm" : "bg-surface-2 rounded-tl-sm",
        )}
      >
        {typing ? <span className="text-muted">…</span> : <MessageText text={text} />}
      </div>
    </div>
  );
}
