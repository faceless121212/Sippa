"use client";

import { Check, ChevronLeft, ChevronRight, MapPin, Pencil, RotateCcw, SendHorizontal } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { CharacterAvatar } from "@/components/CharacterAvatar";
import { MessageText } from "@/components/chat/MessageText";
import { Logo } from "@/components/Logo";
import { buttonClass } from "@/components/ui/button";
import {
  isQuestion,
  quizScene,
  quizzes,
  STATEMENT_SCALE,
  VIBES,
  type ChoiceStep,
  type CompareStep,
  type DemoLine,
  type InfoStep,
  type NameStep,
  type QuizOption,
  type QuizStep,
  type ReassureStep,
  type RecapStep,
  type SliderStep,
  type StatementStep,
  type Vibe,
} from "@/config/quizzes";
import { segments, type SegmentId } from "@/config/segments";
import { seedCharacters } from "@/data/characters";
import { isStaticLanding, withBase } from "@/lib/paths";
import { defaultVibe, matchFromAnswers, type QuizAnswers } from "@/lib/quiz";
import { MAX_FIRST_REPLY, saveQuizStart, welcomePath } from "@/lib/quiz-start";
import { signupHref } from "@/lib/signup";
import { cn } from "@/lib/utils";
import { SegmentMark } from "./SegmentMark";
import { TrustChips } from "./TrustChips";

type Phase = "steps" | "matching" | "result";
/** `back`: the recap screen to return to after changing an answer from it. */
type Saved = { index: number; answers: QuizAnswers; phase: Phase; back?: number };
type Openers = Record<string, Record<string, Record<Vibe, string>>>;

const quizImage = (key: string) => withBase(`/quiz/${key}.jpg`);
const reducedMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

/**
 * Web-funnel quiz (Headway / Noom / Simple-style): one screen per step, a progress bar
 * split into sections with a guide line at the start of each, image cards, sliders,
 * "Do you relate?" statements, reactions from your future match, info and comparison
 * screens, an honest answer to your biggest doubt, a "so far" recap, a matching screen
 * and a personal result where you can tune the first message and reply before sign-up.
 * Answers stay in the browser (sessionStorage); only the reply you send is carried on.
 */
export function Quiz({ segment }: { segment: SegmentId }) {
  const seg = segments[segment];
  const quiz = quizzes[segment];
  const storageKey = `sippa_quiz_${segment}`;
  const totalQuestions = quiz.steps.filter(isQuestion).length;

  const [state, setState] = useState<Saved>({ index: 0, answers: {}, phase: "steps" });
  const { index, answers, phase } = state;
  const step = quiz.steps[index];

  // Pick up where you left off after a reload (per tab).
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(storageKey) ?? "null") as Saved | null;
      if (saved && saved.index < quiz.steps.length) setState(saved);
    } catch {}
  }, [storageKey, quiz.steps.length]);
  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(state));
    } catch {}
  }, [storageKey, state]);

  // Every step starts at the top of the page.
  // (Block body: newer browsers return a Promise from scrollTo, which React would treat as a cleanup.)
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [index, phase]);

  // First messages for the result, loaded in the background while you answer.
  const [openers, setOpeners] = useState<Openers | null>(null);
  useEffect(() => {
    import("@/data/quiz-openers.json").then((m) => setOpeners(m.default as Openers)).catch(() => {});
  }, []);

  const goNext = (patch?: QuizAnswers) =>
    setState((s) => {
      const nextAnswers = patch ? { ...s.answers, ...patch } : s.answers;
      if (s.back !== undefined) return { ...s, answers: nextAnswers, index: s.back, back: undefined };
      return s.index + 1 < quiz.steps.length
        ? { ...s, answers: nextAnswers, index: s.index + 1 }
        : { ...s, answers: nextAnswers, phase: "matching" };
    });
  const goBack = () =>
    setState((s) =>
      s.phase !== "steps"
        ? { ...s, phase: "steps" }
        : s.back !== undefined
          ? { ...s, index: s.back, back: undefined }
          : { ...s, index: Math.max(0, s.index - 1) },
    );
  const editFromRecap = (target: number) => setState((s) => ({ ...s, back: s.index, index: target }));
  const restart = () => setState({ index: 0, answers: {}, phase: "steps" });

  const questionNumber = quiz.steps.slice(0, index + 1).filter(isQuestion).length;
  const name = typeof answers.name === "string" ? answers.name : "";
  const sectionStart = phase === "steps" && (index === 0 || quiz.steps[index - 1].section !== step.section);

  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col px-4 pt-4 pb-6 sm:px-6">
      <SegmentMark segment={segment} />
      <header className="grid grid-cols-[40px_1fr_40px] items-center">
        {(index > 0 || phase === "result") && phase !== "matching" ? (
          <button
            type="button"
            onClick={goBack}
            aria-label="Back"
            className="text-text hover:text-primary-ink -ml-2 grid h-10 w-10 place-items-center rounded-full"
          >
            <ChevronLeft className="h-6 w-6" aria-hidden="true" />
          </button>
        ) : (
          <span />
        )}
        <Link href={`/${segment}`} aria-label="Back to Sippa" className="justify-self-center">
          <Logo />
        </Link>
        {phase === "steps" && isQuestion(step) ? (
          <span className="text-text justify-self-end text-xs font-semibold tabular-nums">
            {questionNumber}/{totalQuestions}
          </span>
        ) : (
          <span />
        )}
      </header>

      {phase === "steps" && (
        <Progress sections={quiz.sections} current={step.section} fraction={sectionFraction(quiz.steps, index)} />
      )}
      {sectionStart && <HostBubble key={step.section} text={quiz.host[step.section]} />}
      {phase === "steps" && index === 0 && <TrustChips className="mt-3 justify-center" />}

      {phase === "steps" &&
        (step.kind === "single" || step.kind === "multi" ? (
          <ChoiceScreen
            key={step.id}
            step={step}
            segment={segment}
            answers={answers}
            onDone={(ids) => goNext({ [step.id]: ids })}
          />
        ) : step.kind === "statement" ? (
          <StatementScreen
            key={step.id}
            step={step}
            chosen={answers[step.id] as number | undefined}
            onDone={(v) => goNext({ [step.id]: v })}
          />
        ) : step.kind === "slider" ? (
          <SliderScreen
            key={step.id}
            step={step}
            chosen={answers[step.id] as number | undefined}
            onDone={(v) => goNext({ [step.id]: v })}
          />
        ) : step.kind === "name" ? (
          <NameScreen key={step.id} step={step} initial={name} onDone={(n) => goNext({ [step.id]: n })} />
        ) : step.kind === "info" ? (
          <InfoScreen key={step.id} step={step} answers={answers} onDone={() => goNext()} />
        ) : step.kind === "reassure" ? (
          <ReassureScreen key={step.id} step={step} answers={answers} onDone={() => goNext()} />
        ) : step.kind === "recap" ? (
          <RecapScreen
            key={step.id}
            step={step}
            steps={quiz.steps}
            answers={answers}
            onEdit={editFromRecap}
            onDone={() => goNext()}
          />
        ) : step.kind === "compare" ? (
          <CompareScreen key={step.id} step={step} onDone={() => goNext()} />
        ) : null)}

      {phase === "matching" && (
        <MatchingScreen
          segment={segment}
          lines={quiz.matching}
          onDone={() => setState((s) => ({ ...s, phase: "result" }))}
        />
      )}

      {phase === "result" && (
        <ResultScreen
          segment={segment}
          answers={answers}
          name={name}
          adultsOnly={seg.adultsOnly}
          openers={openers}
          onRestart={restart}
        />
      )}
    </div>
  );
}

/** How far through the current section we are (0–1). */
function sectionFraction(steps: { section: number }[], index: number) {
  const section = steps[index].section;
  const inSection = steps.flatMap((s, i) => (s.section === section ? [i] : []));
  return (inSection.indexOf(index) + 1) / inSection.length;
}

function Progress({ sections, current, fraction }: { sections: string[]; current: number; fraction: number }) {
  return (
    <div className="mt-3">
      <div className="flex gap-1.5" aria-hidden="true">
        {sections.map((s, i) => (
          <div key={s} className="bg-surface-2 h-1.5 flex-1 overflow-hidden rounded-full">
            <div
              className="bg-primary h-full rounded-full transition-[width] duration-300"
              style={{ width: `${i < current ? 100 : i === current ? fraction * 100 : 0}%` }}
            />
          </div>
        ))}
      </div>
      <p className="text-text mt-2 text-center text-[11px] font-bold tracking-[0.08em] uppercase">
        <span className="sr-only">
          Part {current + 1} of {sections.length}:{" "}
        </span>
        {sections[current]}
      </p>
    </div>
  );
}

/** The Sippa guide (the flower) says one line at the start of each section. */
function HostBubble({ text }: { text: string }) {
  return (
    <div className="animate-rise mt-3 flex items-start gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element -- tiny static icon */}
      <img src={withBase("/icon.svg")} alt="" className="h-8 w-8 shrink-0 rounded-full" />
      <p className="border-border bg-surface rounded-2xl rounded-tl-md border px-3 py-2 text-sm font-semibold">{text}</p>
    </div>
  );
}

function Title({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="animate-rise mt-6 text-center">
      <h1 className="text-[26px] leading-tight font-extrabold tracking-[-0.03em] sm:text-3xl">{children}</h1>
      {hint && <p className="text-text mt-2 text-sm">{hint}</p>}
    </div>
  );
}

/** Sticky bottom button, like a native app. */
function BottomButton({
  children,
  disabled,
  onClick,
  type = "button",
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  return (
    <div className="from-bg sticky bottom-0 -mx-4 mt-auto self-stretch bg-gradient-to-t from-70% to-transparent px-4 pt-6 pb-2 sm:-mx-6 sm:px-6">
      <button type={type} disabled={disabled} onClick={onClick} className={buttonClass({ size: "lg", className: "w-full" })}>
        {children}
      </button>
    </div>
  );
}

function ChoiceScreen({
  step,
  segment,
  answers,
  onDone,
}: {
  step: ChoiceStep;
  segment: SegmentId;
  answers: QuizAnswers;
  onDone: (ids: string[]) => void;
}) {
  const chosen = (answers[step.id] as string[] | undefined) ?? [];
  const [picked, setPicked] = useState<string[]>(chosen);
  const multi = step.kind === "multi";
  const max = step.max ?? step.options.length;
  const leaving = useRef(false);
  const reaction = !multi ? step.options.find((o) => o.id === picked[0])?.reaction : undefined;

  // Who's reacting: the character you'd be matched with right now.
  const reacting = useMemo(
    () => (reaction ? matchFromAnswers(segment, { ...answers, [step.id]: picked }, 1)[0] : undefined),
    [reaction, segment, answers, step.id, picked],
  );

  const choose = (o: QuizOption) => {
    if (multi) {
      setPicked((p) => (p.includes(o.id) ? p.filter((x) => x !== o.id) : p.length < max ? [...p, o.id] : p));
      return;
    }
    setPicked([o.id]);
    // Answers with a reaction wait for "Next"; the rest move on by themselves.
    if (o.reaction || leaving.current) return;
    leaving.current = true;
    setTimeout(() => onDone([o.id]), 220);
  };

  return (
    <main className="flex flex-1 flex-col">
      <Title hint={step.hint}>{step.question}</Title>
      {step.layout === "cards" ? (
        <ul className={cn("mt-6 grid gap-3", step.options.length === 3 ? "grid-cols-3" : "grid-cols-2")}>
          {step.options.map((o, i) => {
            const on = picked.includes(o.id);
            return (
              <li key={o.id} className="animate-rise" style={{ animationDelay: `${100 + i * 60}ms` }}>
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => choose(o)}
                  className={cn(
                    "bg-surface group flex h-full w-full flex-col overflow-hidden rounded-2xl border-2 text-left transition-colors",
                    on ? "border-primary" : "border-border hover:border-text",
                  )}
                >
                  {o.image && (
                    <span className="relative block aspect-[4/5] w-full overflow-hidden">
                      <Image
                        src={quizImage(o.image)}
                        alt=""
                        fill
                        sizes="(min-width: 640px) 260px, 45vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      />
                    </span>
                  )}
                  <span className="flex flex-1 items-center justify-between gap-1 px-3 py-2.5 text-sm leading-snug font-semibold">
                    {o.label}
                    <ChevronRight className="text-text h-4 w-4 shrink-0" aria-hidden="true" />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <ul className="mt-6 space-y-2.5">
          {step.options.map((o, i) => {
            const on = picked.includes(o.id);
            return (
              <li key={o.id} className="animate-rise" style={{ animationDelay: `${100 + i * 60}ms` }}>
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => choose(o)}
                  className={cn(
                    "bg-surface flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-3.5 text-left font-semibold transition-colors",
                    on ? "border-primary" : "border-border hover:border-text",
                  )}
                >
                  {o.emoji && (
                    <span className="text-xl leading-none" aria-hidden="true">
                      {o.emoji}
                    </span>
                  )}
                  <span className="flex-1">{o.label}</span>
                  {multi ? (
                    <span
                      className={cn(
                        "grid h-5 w-5 shrink-0 place-items-center rounded-md border-2",
                        on ? "border-primary bg-primary text-on-primary" : "border-border",
                      )}
                      aria-hidden="true"
                    >
                      {on && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                    </span>
                  ) : (
                    <ChevronRight className="text-text h-4 w-4 shrink-0" aria-hidden="true" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {reaction && reacting && (
        <div key={picked[0]} className="animate-msg mt-5 flex items-end gap-2" aria-live="polite">
          <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full">
            <CharacterAvatar id={reacting.id} name={reacting.name} sizes="36px" />
          </span>
          <p className="bg-surface-2 rounded-2xl rounded-bl-md px-3.5 py-2.5 text-[15px] leading-snug">
            <span className="text-text block text-[11px] font-bold">{reacting.name.split(" ")[0]}</span>
            {reaction}
          </p>
        </div>
      )}
      {(multi || reaction) && (
        <BottomButton disabled={!picked.length} onClick={() => onDone(picked)}>
          {multi ? "Continue" : "Next"}
        </BottomButton>
      )}
    </main>
  );
}

function StatementScreen({
  step,
  chosen,
  onDone,
}: {
  step: StatementStep;
  chosen?: number;
  onDone: (value: number) => void;
}) {
  const [picked, setPicked] = useState(chosen);
  const leaving = useRef(false);
  return (
    <main className="flex flex-1 flex-col">
      <Title>Do you relate to this?</Title>
      <figure className="border-border bg-surface animate-rise mt-6 rounded-3xl border px-6 pt-4 pb-7 text-center">
        <span className="text-primary-ink text-6xl leading-none font-black" aria-hidden="true">
          “
        </span>
        <blockquote className="-mt-3 text-xl leading-snug font-bold">{step.statement}</blockquote>
      </figure>
      <div className="mt-6 grid grid-cols-5 gap-2" role="group" aria-label="How much do you relate?">
        {STATEMENT_SCALE.map((s) => (
          <button
            key={s.value}
            type="button"
            aria-pressed={picked === s.value}
            aria-label={s.label}
            onClick={() => {
              if (leaving.current) return;
              leaving.current = true;
              setPicked(s.value);
              setTimeout(() => onDone(s.value), 220);
            }}
            className={cn(
              "grid aspect-square place-items-center rounded-2xl border-2 text-lg font-extrabold transition-colors",
              picked === s.value
                ? "border-primary bg-primary text-on-primary"
                : "border-border bg-surface hover:border-text",
            )}
          >
            {s.value}
          </button>
        ))}
      </div>
      <div className="text-text mt-2 flex justify-between text-xs font-semibold" aria-hidden="true">
        <span>{STATEMENT_SCALE[0].label}</span>
        <span>{STATEMENT_SCALE[4].label}</span>
      </div>
    </main>
  );
}

/** Where a slider value sits, in words. */
export function sliderLabel(step: SliderStep, v: number) {
  if (v <= 15) return `Totally ${step.left.label.toLowerCase()}`;
  if (v <= 35) return `Mostly ${step.left.label.toLowerCase()}`;
  if (v >= 85) return `Totally ${step.right.label.toLowerCase()}`;
  if (v >= 65) return `Mostly ${step.right.label.toLowerCase()}`;
  return "Somewhere in between";
}

function SliderScreen({
  step,
  chosen,
  onDone,
}: {
  step: SliderStep;
  chosen?: number;
  onDone: (value: number) => void;
}) {
  const [value, setValue] = useState(chosen ?? 50);
  const [moved, setMoved] = useState(chosen !== undefined);
  // The card warms up the further you lean either way.
  const lean = Math.abs(value - 50) / 50;
  return (
    <main className="flex flex-1 flex-col">
      <Title>{step.question}</Title>
      <div
        className="border-border animate-rise mt-8 rounded-3xl border px-5 py-7 transition-colors"
        style={{ background: `color-mix(in oklab, var(--primary) ${Math.round(lean * 28)}%, var(--surface))` }}
      >
        <div className="flex justify-between gap-4 text-sm font-extrabold">
          <span className={cn("transition-colors", value < 40 && "text-primary-ink")}>{step.left.label}</span>
          <span className={cn("text-right transition-colors", value > 60 && "text-primary-ink")}>{step.right.label}</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={value}
          aria-label={`${step.left.label} to ${step.right.label}`}
          aria-valuetext={sliderLabel(step, value)}
          onChange={(e) => {
            setValue(Number(e.target.value));
            setMoved(true);
          }}
          className="accent-primary mt-5 h-2 w-full cursor-pointer"
        />
        <p className="mt-4 text-center text-lg font-bold" aria-hidden="true">
          {moved ? sliderLabel(step, value) : "Drag to choose"}
        </p>
      </div>
      <BottomButton disabled={!moved} onClick={() => onDone(value)}>
        Continue
      </BottomButton>
    </main>
  );
}

function NameScreen({ step, initial, onDone }: { step: NameStep; initial: string; onDone: (name: string) => void }) {
  const [value, setValue] = useState(initial);
  const clean = value.trim().slice(0, 30);
  return (
    <main className="flex flex-1 flex-col">
      <Title hint={step.hint}>{step.question}</Title>
      <form
        className="mt-8 flex flex-1 flex-col"
        onSubmit={(e) => {
          e.preventDefault();
          if (clean) onDone(clean);
        }}
      >
        <label className="sr-only" htmlFor="quiz-name">
          Your name
        </label>
        <input
          id="quiz-name"
          autoComplete="given-name"
          maxLength={30}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Your name"
          className="placeholder:text-text border-border bg-surface focus:border-primary w-full rounded-2xl border-2 px-4 py-4 text-center text-xl font-bold outline-none"
        />
        <button type="button" onClick={() => onDone("")} className="text-text hover:text-primary-ink mt-4 self-center text-sm">
          Skip
        </button>
        <BottomButton type="submit" disabled={!clean}>
          Continue
        </BottomButton>
      </form>
    </main>
  );
}

function Points({ points, delay = 450 }: { points: string[]; delay?: number }) {
  return (
    <ul className="mx-auto mt-5 space-y-2">
      {points.map((p, i) => (
        <li
          key={p}
          className="animate-rise flex items-center gap-2 text-sm font-semibold"
          style={{ animationDelay: `${delay + i * 120}ms` }}
        >
          <Check className="text-primary-ink h-4 w-4 shrink-0" strokeWidth={3} aria-hidden="true" />
          {p}
        </li>
      ))}
    </ul>
  );
}

function InfoScreen({ step, answers, onDone }: { step: InfoStep; answers: QuizAnswers; onDone: () => void }) {
  const echoed = step.echo ? (answers[step.echo.step] as string[] | undefined)?.[0] : undefined;
  const echo = echoed ? step.echo?.text[echoed] : undefined;
  return (
    <main className="flex flex-1 flex-col">
      {echo && <p className="text-primary-ink animate-rise mt-6 text-center text-sm font-bold">{echo}</p>}
      <div
        className={cn(
          "animate-pop relative mx-auto aspect-[4/5] w-full max-w-[340px] overflow-hidden rounded-3xl",
          echo ? "mt-4" : "mt-6",
        )}
      >
        <Image
          src={quizImage(step.image)}
          alt=""
          fill
          sizes="(min-width: 640px) 340px, 90vw"
          className="animate-kenburns object-cover"
          priority
        />
        <ChatDemo lines={step.demo} />
      </div>
      <h1
        className="animate-rise mt-6 text-center text-[26px] leading-tight font-extrabold tracking-[-0.03em]"
        style={{ animationDelay: "150ms" }}
      >
        {step.title}
      </h1>
      <p className="text-text animate-rise mt-3 text-center leading-relaxed" style={{ animationDelay: "300ms" }}>
        {step.body}
      </p>
      {step.points && <Points points={step.points} />}
      <BottomButton onClick={onDone}>Continue</BottomButton>
    </main>
  );
}

/** An honest answer to the doubt you picked. */
function ReassureScreen({ step, answers, onDone }: { step: ReassureStep; answers: QuizAnswers; onDone: () => void }) {
  const picked = (answers[step.step] as string[] | undefined)?.[0];
  const v = (picked && step.variants[picked]) || Object.values(step.variants)[0];
  return (
    <main className="flex flex-1 flex-col items-center">
      <span
        className="animate-pop bg-primary/15 border-primary/40 mt-10 grid h-28 w-28 place-items-center rounded-full border-2 text-6xl"
        aria-hidden="true"
      >
        {v.emoji}
      </span>
      <p className="text-text animate-rise mt-6 text-xs font-bold tracking-[0.08em] uppercase">Fair question</p>
      <h1
        className="animate-rise mt-1 text-center text-[26px] leading-tight font-extrabold tracking-[-0.03em]"
        style={{ animationDelay: "120ms" }}
      >
        {v.title}
      </h1>
      <p className="text-text animate-rise mt-3 text-center leading-relaxed" style={{ animationDelay: "240ms" }}>
        {v.body}
      </p>
      <Points points={v.points} delay={380} />
      <BottomButton onClick={onDone}>Sounds good</BottomButton>
    </main>
  );
}

/** Answers so far, as chips you can tap to change. */
export function recapChips(steps: QuizStep[], answers: QuizAnswers, until: number) {
  const chips: { label: string; index: number }[] = [];
  steps.slice(0, until).forEach((s, index) => {
    const a = answers[s.id];
    if (a === undefined || s.id === "doubt") return;
    if ((s.kind === "single" || s.kind === "multi") && Array.isArray(a))
      s.options.filter((o) => a.includes(o.id)).forEach((o) => chips.push({ label: o.label, index }));
    else if (s.kind === "slider" && typeof a === "number" && (a <= 35 || a >= 65))
      chips.push({ label: (a <= 35 ? s.left : s.right).label, index });
  });
  return chips;
}

function RecapScreen({
  step,
  steps,
  answers,
  onEdit,
  onDone,
}: {
  step: RecapStep;
  steps: QuizStep[];
  answers: QuizAnswers;
  onEdit: (index: number) => void;
  onDone: () => void;
}) {
  const here = steps.findIndex((s) => s.id === step.id);
  const chips = recapChips(steps, answers, here).slice(-12);
  return (
    <main className="flex flex-1 flex-col">
      <Title hint="Tap anything to change it.">{step.title}</Title>
      <ul className="mt-6 flex flex-wrap justify-center gap-2">
        {chips.map((c, i) => (
          <li key={`${c.index}-${c.label}`} className="animate-pop" style={{ animationDelay: `${i * 70}ms` }}>
            <button
              type="button"
              onClick={() => onEdit(c.index)}
              className="border-border bg-surface hover:border-text flex items-center gap-1.5 rounded-full border-2 px-3.5 py-2 text-sm font-semibold"
            >
              {c.label}
              <Pencil className="text-text h-3 w-3" aria-hidden="true" />
              <span className="sr-only">(change)</span>
            </button>
          </li>
        ))}
      </ul>
      <BottomButton onClick={onDone}>Looks right</BottomButton>
    </main>
  );
}

/** A forgetful chatbot next to your match, both playing out. */
function CompareScreen({ step, onDone }: { step: CompareStep; onDone: () => void }) {
  return (
    <main className="flex flex-1 flex-col">
      <Title>{step.title}</Title>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <section aria-label="A typical chatbot" className="animate-rise">
          <p className="text-text text-center text-xs font-bold tracking-[0.08em] uppercase">Typical chatbot</p>
          <div className="bg-surface-2 mt-2 flex h-64 flex-col justify-end gap-2 rounded-3xl p-3">
            {step.theirs.map((t, i) => (
              <p
                key={t}
                className="animate-msg text-text self-start rounded-2xl rounded-bl-md bg-white/10 px-3 py-2 text-[13px] leading-snug"
                style={{ animationDelay: `${700 + i * 1100}ms` }}
              >
                {t}
              </p>
            ))}
            <p
              className="animate-pop text-text self-center rounded-full border border-current px-2.5 py-1 text-[11px] font-bold"
              style={{ animationDelay: "2600ms" }}
            >
              😶 Forgets you
            </p>
          </div>
        </section>
        <section aria-label="Your Sippa match" className="animate-rise" style={{ animationDelay: "120ms" }}>
          <p className="text-primary-ink text-center text-xs font-bold tracking-[0.08em] uppercase">Your Sippa match</p>
          <div className="relative mt-2 h-64 overflow-hidden rounded-3xl bg-neutral-900">
            <ChatDemo lines={step.ours} />
          </div>
        </section>
      </div>
      <p className="text-text animate-rise mt-5 text-center leading-relaxed" style={{ animationDelay: "300ms" }}>
        {step.body}
      </p>
      <BottomButton onClick={onDone}>Continue</BottomButton>
    </main>
  );
}

/**
 * A short chat that plays over an image: bubbles arrive one by one, the character
 * "types" before each reply, and the highlight chip pops in.
 */
function ChatDemo({ lines }: { lines: DemoLine[] }) {
  const [shown, setShown] = useState(0);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    if (reducedMotion()) {
      setShown(lines.length);
      return;
    }
    const timers: ReturnType<typeof setTimeout>[] = [];
    let t = 600;
    lines.forEach((line, i) => {
      if (line.kind === "them") {
        timers.push(setTimeout(() => setTyping(true), t));
        t += 1000;
      }
      timers.push(
        setTimeout(() => {
          setTyping(false);
          setShown(i + 1);
        }, t),
      );
      t += line.kind === "note" ? 500 : line.kind === "badge" ? 1100 : 900;
    });
    return () => timers.forEach(clearTimeout);
  }, [lines]);

  return (
    <div
      role="img"
      aria-label={lines.map((l) => l.text).join(" · ")}
      className="absolute inset-0 flex flex-col justify-end gap-2 overflow-hidden bg-gradient-to-t from-black/85 via-black/35 to-transparent p-3"
    >
      {lines.slice(0, shown).map((line, i) =>
        line.kind === "note" ? (
          <p
            key={i}
            className="animate-msg self-center rounded-full bg-black/50 px-2.5 py-0.5 text-[10px] font-bold tracking-[0.08em] text-white uppercase"
          >
            {line.text}
          </p>
        ) : line.kind === "badge" ? (
          <p
            key={i}
            className="animate-pop bg-primary text-on-primary self-center rounded-full px-3 py-1.5 text-center text-xs font-extrabold shadow-lg"
          >
            {line.text}
          </p>
        ) : (
          <p
            key={i}
            className={cn(
              "animate-msg max-w-[88%] rounded-2xl px-3 py-2 text-[13px] leading-snug shadow-md",
              line.kind === "you"
                ? "bg-primary text-on-primary self-end rounded-br-md font-semibold"
                : "self-start rounded-bl-md bg-white/95 text-neutral-900",
            )}
          >
            {line.text}
          </p>
        ),
      )}
      {typing && (
        <span className="animate-msg flex gap-1 self-start rounded-2xl rounded-bl-md bg-white/95 px-3 py-2.5">
          {[0, 1, 2].map((d) => (
            <span
              key={d}
              className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-500"
              style={{ animationDelay: `${d * 120}ms` }}
            />
          ))}
        </span>
      )}
    </div>
  );
}

/** First lines of the segment's characters, to rotate while matching. */
function snippetsFor(segment: SegmentId) {
  return seedCharacters
    .filter((c) => c.category === segments[segment].category)
    .map((c) => ({
      id: c.id,
      name: c.name.split(" ")[0],
      text: c.firstMessage.replace(/\*[^*]*\*/g, "").trim().split(/(?<=[.!?])\s/)[0].slice(0, 90),
    }))
    .filter((s) => s.text.length > 12);
}

/** "Finding your match…" — a percentage, three bars and lines from real characters, then the result. */
function MatchingScreen({ segment, lines, onDone }: { segment: SegmentId; lines: string[]; onDone: () => void }) {
  const [progress, setProgress] = useState(0); // 0..lines.length
  const snippets = useMemo(() => snippetsFor(segment), [segment]);
  const [snippet, setSnippet] = useState(0);
  const done = useRef(onDone);
  done.current = onDone;

  useEffect(() => {
    const total = reducedMotion() ? 600 : 4800;
    const start = performance.now();
    let frame = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / total) * lines.length;
      setProgress(p);
      if (p < lines.length) frame = requestAnimationFrame(tick);
      else timer = setTimeout(() => done.current(), 300);
    };
    frame = requestAnimationFrame(tick);
    const rotate = setInterval(() => setSnippet((n) => n + 1), 1500);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
      clearInterval(rotate);
    };
  }, [lines.length]);

  const percent = Math.round((progress / lines.length) * 100);
  const s = snippets.length ? snippets[(snippet * 7) % snippets.length] : null;
  return (
    <main className="flex flex-1 flex-col justify-center py-10">
      <p className="text-center text-6xl font-black tabular-nums" aria-hidden="true">
        {percent}%
      </p>
      <h1 className="mt-3 text-center text-2xl font-extrabold tracking-[-0.03em]">Finding your match…</h1>
      <ul className="mt-8 space-y-5">
        {lines.map((line, i) => {
          const f = Math.max(0, Math.min(1, progress - i));
          return (
            <li key={line}>
              <div className="flex items-center justify-between text-sm font-semibold">
                <span className={f > 0 ? "" : "text-text"}>{line}</span>
                {f >= 1 ? (
                  <Check className="text-primary-ink h-4 w-4" strokeWidth={3} aria-hidden="true" />
                ) : (
                  <span className="text-text tabular-nums" aria-hidden="true">
                    {Math.round(f * 100)}%
                  </span>
                )}
              </div>
              <div className="bg-surface-2 mt-2 h-2 overflow-hidden rounded-full" aria-hidden="true">
                <div className="bg-primary h-full rounded-full" style={{ width: `${f * 100}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
      {s && (
        <div key={snippet} className="animate-msg mt-8 flex items-end gap-2" aria-hidden="true">
          <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full">
            <CharacterAvatar id={s.id} name={s.name} sizes="32px" />
          </span>
          <p className="bg-surface-2 rounded-2xl rounded-bl-md px-3 py-2 text-sm">
            <span className="text-text block text-[11px] font-bold">{s.name}</span>“{s.text}”
          </p>
        </div>
      )}
    </main>
  );
}

const CONFETTI_COLORS = ["#C3FF00", "#FF6B9A", "#7CC4FF", "#FFD166", "#B69CFF"];

/** A one-off burst when your match appears. */
function Confetti() {
  const [on, setOn] = useState(true);
  useEffect(() => {
    if (reducedMotion()) setOn(false);
    const t = setTimeout(() => setOn(false), 2200);
    return () => clearTimeout(t);
  }, []);
  if (!on) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0" aria-hidden="true">
      {Array.from({ length: 36 }, (_, i) => (
        <span
          key={i}
          className="animate-confetti absolute top-0 block h-2.5 w-1.5 rounded-sm"
          style={
            {
              left: `${(i * 37) % 100}%`,
              background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
              animationDelay: `${(i % 6) * 60}ms`,
              "--dx": `${((i * 53) % 120) - 60}px`,
              "--rot": `${360 + ((i * 97) % 360)}deg`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

function ResultScreen({
  segment,
  answers,
  name,
  adultsOnly,
  openers,
  onRestart,
}: {
  segment: SegmentId;
  answers: QuizAnswers;
  name: string;
  adultsOnly: boolean;
  openers: Openers | null;
  onRestart: () => void;
}) {
  const quiz = quizzes[segment];
  const matches = useMemo(() => matchFromAnswers(segment, answers), [segment, answers]);
  const [pick, setPick] = useState(0);
  const [vibe, setVibe] = useState<Vibe>(() => defaultVibe(segment, answers));
  const [reply, setReply] = useState("");
  const match = matches[pick];
  const sceneId = (answers.scene as string[] | undefined)?.[0];
  const scene = quizScene(segment, sceneId);
  if (!match) return null;

  const first = match.name.split(" ")[0];
  const opener = (sceneId && openers?.[match.id]?.[sceneId]?.[vibe]) || match.firstMessage;
  const next = welcomePath(match.id, scene?.id, scene ? vibe : undefined);

  // The scene, vibe and (optional) first reply travel to the app in a short-lived cookie.
  const remember = (r?: string) => saveQuizStart({ c: match.id, s: scene?.id, v: scene ? vibe : undefined, r });
  const go = (text: string) => {
    const r = text.trim().slice(0, MAX_FIRST_REPLY);
    if (!r) return;
    remember(r);
    location.assign(signupHref(next));
  };

  return (
    <main className="flex flex-1 flex-col py-5" aria-live="polite">
      <Confetti />
      <h1 className="animate-rise text-center text-3xl font-extrabold tracking-[-0.03em]">
        {name ? `${name}, meet ${first}` : `Meet ${first}`}
        {match.age ? <span className="text-text font-semibold">, {match.age}</span> : null}
      </h1>

      {/* Portrait with the hook and why you click laid over it. */}
      <div className="animate-pop relative mx-auto mt-4 aspect-[4/5] w-full max-w-[300px] overflow-hidden rounded-3xl">
        <CharacterAvatar id={match.id} name={match.name} sizes="300px" priority />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 pt-12">
          <p className="text-sm leading-snug font-semibold text-white">{match.hook}</p>
          {match.reasons.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-1" aria-label="Why you two click">
              {match.reasons.slice(0, 3).map((r) => (
                <li key={r} className="bg-primary text-on-primary rounded-full px-2 py-0.5 text-[11px] font-bold">
                  {r}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* The first message: scene + vibe in one slim row, then the message and your reply. */}
      <section aria-label={`Your first message from ${first}`} className="mt-5">
        {scene && (
          <div className="flex items-center justify-between gap-2">
            <p className="text-text flex min-w-0 items-center gap-1 truncate text-xs font-semibold">
              <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{scene.label}</span>
            </p>
            <div className="flex shrink-0 gap-1" role="group" aria-label="Tune the first message">
              {VIBES.map((v) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={vibe === v}
                  onClick={() => setVibe(v)}
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-[11px] font-bold transition-colors",
                    vibe === v ? "border-primary bg-primary text-on-primary" : "border-border text-text hover:text-primary-ink",
                  )}
                >
                  {quiz.vibes[v]}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="mt-2 flex gap-2">
          <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full">
            <CharacterAvatar id={match.id} name={match.name} sizes="32px" />
          </span>
          <div
            key={`${match.id}-${vibe}`}
            className="animate-msg bg-surface-2 rounded-2xl rounded-tl-sm px-4 py-3 text-[15px] leading-relaxed"
          >
            <MessageText text={opener} dim={false} />
          </div>
        </div>

        {isStaticLanding ? (
          <Link href={signupHref(next)} className={buttonClass({ size: "lg", className: "mt-4 w-full" })}>
            Reply to {first}
          </Link>
        ) : (
          <>
            <ul className="mt-3 flex flex-wrap justify-end gap-1.5" aria-label="Quick replies">
              {quiz.quickReplies.map((q) => (
                <li key={q}>
                  <button
                    type="button"
                    onClick={() => go(q)}
                    className="border-primary/60 hover:bg-primary/10 rounded-full border px-3 py-1.5 text-sm font-semibold"
                  >
                    {q}
                  </button>
                </li>
              ))}
            </ul>
            <form
              className="mt-2 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                go(reply);
              }}
            >
              <label className="sr-only" htmlFor="first-reply">
                Your reply to {first}
              </label>
              <input
                id="first-reply"
                value={reply}
                maxLength={MAX_FIRST_REPLY}
                onChange={(e) => setReply(e.target.value)}
                placeholder={`Reply to ${first}…`}
                className="placeholder:text-text border-border bg-surface focus:border-primary min-w-0 flex-1 rounded-full border-2 px-4 py-3 outline-none"
              />
              <button
                type="submit"
                disabled={!reply.trim()}
                aria-label="Send"
                className={buttonClass({ size: "lg", className: "aspect-square shrink-0 rounded-full px-0" })}
              >
                <SendHorizontal className="h-5 w-5" aria-hidden="true" />
              </button>
            </form>
          </>
        )}
        <p className="text-text mt-2 text-center text-xs">
          Free · {adultsOnly ? "18+ · " : ""}always an AI
          {!isStaticLanding && (
            <>
              {" · "}
              <Link href={signupHref(next)} onClick={() => remember()} className="underline underline-offset-2">
                Skip
              </Link>
            </>
          )}
        </p>
      </section>

      {/* First week: a row of dots with a few words each. */}
      <section aria-label="Your first week" className="mt-7">
        <ol className="grid grid-cols-4 gap-1 text-center">
          {quiz.week.map((w, i) => (
            <li key={w.day} className="animate-rise relative" style={{ animationDelay: `${200 + i * 120}ms` }}>
              {i > 0 && <span className="bg-border absolute top-[5px] right-1/2 h-0.5 w-full" aria-hidden="true" />}
              <span
                className={cn(
                  "relative mx-auto block h-3 w-3 rounded-full border-2",
                  i === 0 ? "border-primary bg-primary" : "border-border bg-bg",
                )}
                aria-hidden="true"
              />
              <span className="text-text mt-1.5 block text-[10px] font-bold tracking-[0.08em] uppercase">{w.day}</span>
              <span className="block text-xs leading-tight font-semibold">{w.text.replaceAll("{name}", first)}</span>
            </li>
          ))}
        </ol>
      </section>

      <div className="mt-7 flex items-center justify-center gap-3">
        {matches.length > 1 && (
          <>
            <span className="text-text text-xs font-semibold">Or meet</span>
            <ul className="flex gap-2" aria-label="Also a great fit">
              {matches.map((m, i) =>
                i === pick ? null : (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => setPick(i)}
                      aria-label={`Meet ${m.name} instead`}
                      title={m.name}
                      className="border-border hover:border-primary relative block h-10 w-10 overflow-hidden rounded-full border-2"
                    >
                      <CharacterAvatar id={m.id} name={m.name} sizes="40px" />
                    </button>
                  </li>
                ),
              )}
            </ul>
            <span className="bg-border h-5 w-px" aria-hidden="true" />
          </>
        )}
        <button
          type="button"
          onClick={onRestart}
          aria-label="Retake the quiz"
          className="text-text hover:text-primary-ink flex items-center gap-1 text-xs font-semibold"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Retake
        </button>
      </div>
    </main>
  );
}
