"use client";

import { Check, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { CharacterAvatar } from "@/components/CharacterAvatar";
import { MessageText } from "@/components/chat/MessageText";
import { Logo } from "@/components/Logo";
import { buttonClass } from "@/components/ui/button";
import {
  isQuestion,
  quizzes,
  STATEMENT_SCALE,
  type ChoiceStep,
  type InfoStep,
  type NameStep,
  type QuizOption,
  type StatementStep,
} from "@/config/quizzes";
import { segments, type SegmentId } from "@/config/segments";
import { withBase } from "@/lib/paths";
import { matchFromAnswers, type QuizAnswers } from "@/lib/quiz";
import { signupHref } from "@/lib/signup";
import { cn } from "@/lib/utils";
import { SegmentMark } from "./SegmentMark";

type Phase = "steps" | "matching" | "result";
type Saved = { index: number; answers: QuizAnswers; phase: Phase };

const quizImage = (key: string) => withBase(`/quiz/${key}.jpg`);

/**
 * Web-funnel quiz (Headway-style): one screen per step, a progress bar split into
 * sections, image cards, "Do you relate?" statements, info screens, a matching
 * screen and a personal result. Answers never leave the browser (sessionStorage only).
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

  const goNext = (patch?: QuizAnswers) =>
    setState((s) => {
      const nextAnswers = patch ? { ...s.answers, ...patch } : s.answers;
      return s.index + 1 < quiz.steps.length
        ? { ...s, answers: nextAnswers, index: s.index + 1 }
        : { ...s, answers: nextAnswers, phase: "matching" };
    });
  const goBack = () =>
    setState((s) => (s.phase !== "steps" ? { ...s, phase: "steps" } : { ...s, index: Math.max(0, s.index - 1) }));
  const restart = () => setState({ index: 0, answers: {}, phase: "steps" });

  const questionNumber = quiz.steps.slice(0, index + 1).filter(isQuestion).length;
  const name = typeof answers.name === "string" ? answers.name : "";

  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col px-4 pt-4 pb-6 sm:px-6">
      <SegmentMark segment={segment} />
      <header className="grid grid-cols-[40px_1fr_40px] items-center">
        {(index > 0 || phase === "result") && phase !== "matching" ? (
          <button
            type="button"
            onClick={goBack}
            aria-label="Back"
            className="text-muted hover:text-text -ml-2 grid h-10 w-10 place-items-center rounded-full"
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
          <span className="text-muted justify-self-end text-xs font-semibold tabular-nums">
            {questionNumber}/{totalQuestions}
          </span>
        ) : (
          <span />
        )}
      </header>

      {phase === "steps" && (
        <Progress sections={quiz.sections} current={step.section} fraction={sectionFraction(quiz.steps, index)} />
      )}

      {phase === "steps" &&
        (step.kind === "single" || step.kind === "multi" ? (
          <ChoiceScreen
            key={step.id}
            step={step}
            chosen={(answers[step.id] as string[] | undefined) ?? []}
            onDone={(ids) => goNext({ [step.id]: ids })}
          />
        ) : step.kind === "statement" ? (
          <StatementScreen
            key={step.id}
            step={step}
            chosen={answers[step.id] as number | undefined}
            onDone={(v) => goNext({ [step.id]: v })}
          />
        ) : step.kind === "name" ? (
          <NameScreen key={step.id} step={step} initial={name} onDone={(n) => goNext({ [step.id]: n })} />
        ) : step.kind === "info" ? (
          <InfoScreen key={step.id} step={step} answers={answers} onDone={() => goNext()} />
        ) : null)}

      {phase === "matching" && (
        <MatchingScreen lines={quiz.matching} onDone={() => setState((s) => ({ ...s, phase: "result" }))} />
      )}

      {phase === "result" && (
        <ResultScreen
          segment={segment}
          answers={answers}
          name={name}
          adultsOnly={seg.adultsOnly}
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
      <p className="text-muted mt-2 text-center text-[11px] font-bold tracking-[0.08em] uppercase">
        <span className="sr-only">
          Part {current + 1} of {sections.length}:{" "}
        </span>
        {sections[current]}
      </p>
    </div>
  );
}

function Title({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mt-6 text-center">
      <h1 className="text-[26px] leading-tight font-extrabold tracking-[-0.03em] sm:text-3xl">{children}</h1>
      {hint && <p className="text-muted mt-2 text-sm">{hint}</p>}
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
    <div className="from-bg sticky bottom-0 -mx-4 mt-auto bg-gradient-to-t from-70% to-transparent px-4 pt-6 pb-2 sm:-mx-6 sm:px-6">
      <button type={type} disabled={disabled} onClick={onClick} className={buttonClass({ size: "lg", className: "w-full" })}>
        {children}
      </button>
    </div>
  );
}

function ChoiceScreen({
  step,
  chosen,
  onDone,
}: {
  step: ChoiceStep;
  chosen: string[];
  onDone: (ids: string[]) => void;
}) {
  const [picked, setPicked] = useState<string[]>(chosen);
  const multi = step.kind === "multi";
  const max = step.max ?? step.options.length;
  const leaving = useRef(false);

  const choose = (o: QuizOption) => {
    if (!multi) {
      if (leaving.current) return;
      leaving.current = true;
      setPicked([o.id]);
      // A beat to see the selection, then move on (no extra tap needed).
      setTimeout(() => onDone([o.id]), 220);
      return;
    }
    setPicked((p) => (p.includes(o.id) ? p.filter((x) => x !== o.id) : p.length < max ? [...p, o.id] : p));
  };

  return (
    <main className="flex flex-1 flex-col">
      <Title hint={step.hint}>{step.question}</Title>
      {step.layout === "cards" ? (
        <ul className={cn("mt-6 grid gap-3", step.options.length === 3 ? "grid-cols-3" : "grid-cols-2")}>
          {step.options.map((o) => {
            const on = picked.includes(o.id);
            return (
              <li key={o.id}>
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
                    <ChevronRight className="text-muted h-4 w-4 shrink-0" aria-hidden="true" />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <ul className="mt-6 space-y-2.5">
          {step.options.map((o) => {
            const on = picked.includes(o.id);
            return (
              <li key={o.id}>
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
                    <ChevronRight className="text-muted h-4 w-4 shrink-0" aria-hidden="true" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {multi && (
        <BottomButton disabled={!picked.length} onClick={() => onDone(picked)}>
          Continue
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
      <figure className="border-border bg-surface mt-6 rounded-3xl border px-6 pt-4 pb-7 text-center">
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
      <div className="text-muted mt-2 flex justify-between text-xs font-semibold" aria-hidden="true">
        <span>{STATEMENT_SCALE[0].label}</span>
        <span>{STATEMENT_SCALE[4].label}</span>
      </div>
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
          className="border-border bg-surface focus:border-primary w-full rounded-2xl border-2 px-4 py-4 text-center text-xl font-bold outline-none"
        />
        <button type="button" onClick={() => onDone("")} className="text-muted hover:text-text mt-4 self-center text-sm">
          Skip
        </button>
        <BottomButton type="submit" disabled={!clean}>
          Continue
        </BottomButton>
      </form>
    </main>
  );
}

function InfoScreen({ step, answers, onDone }: { step: InfoStep; answers: QuizAnswers; onDone: () => void }) {
  const echoed = step.echo ? (answers[step.echo.step] as string[] | undefined)?.[0] : undefined;
  const echo = echoed ? step.echo?.text[echoed] : undefined;
  return (
    <main className="flex flex-1 flex-col">
      {echo && <p className="text-primary-ink mt-6 text-center text-sm font-bold">{echo}</p>}
      <div
        className={cn(
          "relative mx-auto aspect-square w-full max-w-xs overflow-hidden rounded-3xl",
          echo ? "mt-4" : "mt-6",
        )}
      >
        <Image
          src={quizImage(step.image)}
          alt=""
          fill
          sizes="(min-width: 640px) 320px, 80vw"
          className="object-cover"
          priority
        />
      </div>
      <h1 className="mt-6 text-center text-[26px] leading-tight font-extrabold tracking-[-0.03em]">{step.title}</h1>
      <p className="text-muted mt-3 text-center leading-relaxed">{step.body}</p>
      {step.points && (
        <ul className="mx-auto mt-5 space-y-2">
          {step.points.map((p) => (
            <li key={p} className="flex items-center gap-2 text-sm font-semibold">
              <Check className="text-primary-ink h-4 w-4 shrink-0" strokeWidth={3} aria-hidden="true" />
              {p}
            </li>
          ))}
        </ul>
      )}
      <BottomButton onClick={onDone}>Continue</BottomButton>
    </main>
  );
}

/** "Finding your match…" — three bars fill one after another, then the result. */
function MatchingScreen({ lines, onDone }: { lines: string[]; onDone: () => void }) {
  const [progress, setProgress] = useState(0); // 0..lines.length
  const done = useRef(onDone);
  done.current = onDone;
  useEffect(() => {
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const total = reduced ? 600 : 4200;
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
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
    };
  }, [lines.length]);

  const percent = Math.round((progress / lines.length) * 100);
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
                <span className={f > 0 ? "" : "text-muted"}>{line}</span>
                {f >= 1 ? (
                  <Check className="text-primary-ink h-4 w-4" strokeWidth={3} aria-hidden="true" />
                ) : (
                  <span className="text-muted tabular-nums" aria-hidden="true">
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
    </main>
  );
}

function ResultScreen({
  segment,
  answers,
  name,
  adultsOnly,
  onRestart,
}: {
  segment: SegmentId;
  answers: QuizAnswers;
  name: string;
  adultsOnly: boolean;
  onRestart: () => void;
}) {
  const matches = useMemo(() => matchFromAnswers(segment, answers), [segment, answers]);
  const [pick, setPick] = useState(0);
  const match = matches[pick];
  if (!match) return null;
  const first = match.name.split(" ")[0];

  return (
    <main className="flex flex-1 flex-col py-6" aria-live="polite">
      <p className="text-primary-ink text-center text-xs font-bold tracking-[0.08em] uppercase">
        {name ? `${name}, here's your match` : "Your match"}
      </p>
      <h1 className="mt-1 text-center text-3xl font-extrabold tracking-[-0.03em]">
        Meet {match.name}
        {match.age ? <span className="text-muted font-semibold">, {match.age}</span> : null}
      </h1>
      <div className="relative mx-auto mt-5 aspect-[3/4] w-56 overflow-hidden rounded-3xl">
        <CharacterAvatar id={match.id} name={match.name} sizes="224px" priority />
      </div>
      <p className="mt-4 text-center font-semibold">{match.hook}</p>

      {match.reasons.length > 0 && (
        <section className="mt-5">
          <h2 className="text-muted text-center text-xs font-bold tracking-[0.08em] uppercase">Why you two click</h2>
          <ul className="mt-2 flex flex-wrap justify-center gap-1.5">
            {match.reasons.slice(0, 4).map((r) => (
              <li key={r} className="border-primary/50 bg-primary/10 rounded-full border px-3 py-1 text-xs font-semibold">
                {r}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-5 flex gap-2">
        <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full">
          <CharacterAvatar id={match.id} name={match.name} sizes="32px" />
        </span>
        <div className="border-border bg-surface rounded-2xl rounded-tl-sm border p-4 text-[15px] leading-relaxed">
          <MessageText text={match.firstMessage} />
        </div>
      </div>

      <Link href={signupHref(`/app/welcome?c=${match.id}`)} className={buttonClass({ size: "lg", className: "mt-6" })}>
        Reply to {first}
      </Link>
      <p className="text-muted mt-2 text-center text-xs">
        Free account · 30 messages a day · {adultsOnly ? "18+ · " : ""}always an AI
      </p>

      {matches.length > 1 && (
        <div className="mt-8">
          <p className="text-sm font-semibold">Also a great fit</p>
          <ul className="mt-2 grid grid-cols-2 gap-2">
            {matches.map((m, i) =>
              i === pick ? null : (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => setPick(i)}
                    className="border-border bg-surface hover:border-text flex w-full items-center gap-2 rounded-xl border p-2 text-left"
                  >
                    <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full">
                      <CharacterAvatar id={m.id} name={m.name} sizes="40px" />
                    </span>
                    <span className="min-w-0 truncate text-sm font-semibold">{m.name}</span>
                  </button>
                </li>
              ),
            )}
          </ul>
        </div>
      )}
      <button
        type="button"
        onClick={onRestart}
        className="text-muted hover:text-text mt-8 flex items-center gap-1 self-center text-sm"
      >
        <RotateCcw className="h-4 w-4" aria-hidden="true" /> Retake the quiz
      </button>
    </main>
  );
}
