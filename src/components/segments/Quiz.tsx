"use client";

import { ArrowLeft, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { CharacterAvatar } from "@/components/CharacterAvatar";
import { MessageText } from "@/components/chat/MessageText";
import { Logo } from "@/components/Logo";
import { buttonClass } from "@/components/ui/button";
import { segments, type QuizOption, type SegmentId } from "@/config/segments";
import { matchCharacters } from "@/lib/quiz";
import { signupHref } from "@/lib/signup";
import { cn } from "@/lib/utils";
import { SegmentMark } from "./SegmentMark";

export function Quiz({ segment }: { segment: SegmentId }) {
  const seg = segments[segment];
  const [answers, setAnswers] = useState<QuizOption[]>([]);
  const step = answers.length;
  const done = step === seg.questions.length;
  const matches = useMemo(() => (done ? matchCharacters(segment, answers) : []), [done, segment, answers]);
  const [pick, setPick] = useState(0);
  const match = matches[pick];

  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col px-4 py-6 sm:px-6">
      <SegmentMark segment={segment} />
      <header className="flex items-center justify-between">
        <Link href={`/${segment}`} aria-label="Back to Sippa">
          <Logo />
        </Link>
        <span className="text-muted text-xs">{seg.eyebrow}</span>
      </header>

      {!done ? (
        <main className="flex flex-1 flex-col justify-center py-10">
          <p className="text-muted text-xs font-bold tracking-[0.08em] uppercase">
            Question {step + 1} of {seg.questions.length}
          </p>
          <div className="bg-surface-2 mt-2 h-1.5 overflow-hidden rounded-full" aria-hidden="true">
            <div
              className="bg-primary h-full rounded-full transition-[width] duration-300"
              style={{ width: `${(step / seg.questions.length) * 100}%` }}
            />
          </div>
          <h1 className="mt-6 text-3xl font-extrabold tracking-[-0.03em]">{seg.questions[step].question}</h1>
          <ul className="mt-6 space-y-2">
            {seg.questions[step].options.map((o) => (
              <li key={o.label}>
                <button
                  type="button"
                  onClick={() => setAnswers((a) => [...a, o])}
                  className="border-border bg-surface hover:border-text w-full rounded-xl border p-4 text-left font-semibold transition-colors"
                >
                  {o.label}
                </button>
              </li>
            ))}
          </ul>
          {step > 0 && (
            <button
              type="button"
              onClick={() => setAnswers((a) => a.slice(0, -1))}
              className="text-muted hover:text-text mt-6 flex items-center gap-1 self-start text-sm"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back
            </button>
          )}
        </main>
      ) : match ? (
        <main className="flex flex-1 flex-col py-8" aria-live="polite">
          <p className="text-muted text-xs font-bold tracking-[0.08em] uppercase">Your match</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-[-0.03em]">
            Meet {match.name}
            {match.age ? <span className="text-muted font-semibold">, {match.age}</span> : null}
          </h1>
          <div className="mt-5 grid grid-cols-[120px_1fr] gap-4">
            <div className="aspect-[3/4] overflow-hidden rounded-xl">
              <CharacterAvatar id={match.id} name={match.name} sizes="120px" priority />
            </div>
            <div>
              <p className="font-semibold">{match.hook}</p>
              <ul className="mt-2 flex flex-wrap gap-1" aria-label="Tags">
                {match.tags.slice(0, 3).map((t) => (
                  <li key={t} className="border-border rounded-md border px-2 py-0.5 text-[11px]">
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-border bg-surface mt-5 rounded-2xl rounded-tl-sm border p-4 text-[15px] leading-relaxed">
            <MessageText text={match.firstMessage} />
          </div>
          <Link
            href={signupHref(`/app/welcome?c=${match.id}`)}
            className={buttonClass({ size: "lg", className: "mt-6" })}
          >
            Reply to {match.name.split(" ")[0]}
          </Link>
          <p className="text-muted mt-2 text-center text-xs">
            Free account · 30 messages a day · {seg.adultsOnly ? "18+ · " : ""}always an AI
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
                        className={cn(
                          "border-border bg-surface hover:border-text flex w-full items-center gap-2 rounded-xl border p-2 text-left",
                        )}
                      >
                        <span className="h-10 w-10 shrink-0 overflow-hidden rounded-full">
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
            onClick={() => {
              setAnswers([]);
              setPick(0);
            }}
            className="text-muted hover:text-text mt-8 flex items-center gap-1 self-center text-sm"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" /> Retake the quiz
          </button>
        </main>
      ) : null}
    </div>
  );
}
