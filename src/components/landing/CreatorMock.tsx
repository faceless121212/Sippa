"use client";

import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { creatorExamples } from "@/data/landing";
import { cn } from "@/lib/utils";
import { CharacterCard } from "../CharacterCard";

type Phase = "typing" | "brewing" | "poured";

const TYPE_MS = 45;
const BREW_MS = 1300;
const HOLD_MS = 3800;

/**
 * Decorative hero animation: a description types itself, the cup brews,
 * and a character card "pours" out. The first frame is server-rendered in
 * its finished state; the loop starts after the page settles and never runs
 * for reduced-motion users. Animations are plain CSS (see globals.css).
 */
export function CreatorMock() {
  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState(creatorExamples[0].prompt.length);
  const [phase, setPhase] = useState<Phase>("poured");
  const [animate, setAnimate] = useState(false);

  const example = creatorExamples[index];
  const prompt = example.prompt;

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const start = setTimeout(() => setAnimate(true), 1500);
    return () => clearTimeout(start);
  }, []);

  useEffect(() => {
    if (!animate) return;
    let timer: ReturnType<typeof setTimeout>;
    if (phase === "typing") {
      timer =
        typed < prompt.length
          ? setTimeout(() => setTyped((t) => t + 1), TYPE_MS)
          : setTimeout(() => setPhase("brewing"), 400);
    } else if (phase === "brewing") {
      timer = setTimeout(() => setPhase("poured"), BREW_MS);
    } else {
      timer = setTimeout(() => {
        setIndex((i) => (i + 1) % creatorExamples.length);
        setTyped(0);
        setPhase("typing");
      }, HOLD_MS);
    }
    return () => clearTimeout(timer);
  }, [animate, phase, typed, prompt.length]);

  return (
    <figure className="relative mx-auto w-full max-w-md">
      <figcaption className="sr-only">
        Animated example: someone describes a character in one sentence and Sippa creates it.
      </figcaption>
      <div aria-hidden="true" className="border-border bg-surface rounded-xl border p-4 shadow-2xl sm:p-5">
        <div className="border-border bg-bg flex items-center gap-2 rounded-xl border px-4 py-3">
          <Sparkles className="text-primary-ink h-4 w-4 shrink-0" />
          <span className="min-h-10 flex-1 text-sm sm:min-h-6">
            {prompt.slice(0, typed)}
            {phase === "typing" && (
              <span className="bg-primary ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 animate-pulse" />
            )}
          </span>
        </div>

        <div className="relative mt-4 flex h-[400px] items-end justify-center sm:h-[430px]">
          {phase === "poured" && (
            <div
              key={example.character.id}
              className={cn("absolute top-0 z-20 w-[58%] max-w-[220px]", animate && "animate-pour")}
            >
              <CharacterCard character={example.character} className="shadow-xl" priority={index === 0} />
            </div>
          )}
          <Cup brewing={phase === "brewing"} />
        </div>
      </div>
    </figure>
  );
}

function Cup({ brewing }: { brewing: boolean }) {
  return (
    <div className="relative z-10 flex flex-col items-center">
      <div className="flex h-10 items-end gap-2">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={cn("bg-muted block h-2 w-1.5 rounded-full opacity-25", brewing && "animate-steam")}
            style={{ animationDelay: `${i * 180}ms` }}
          />
        ))}
      </div>
      <svg viewBox="0 0 120 70" className="w-28">
        <path d="M10 6 h86 v26 a30 30 0 0 1 -30 30 h-26 a30 30 0 0 1 -30 -30 z" fill="var(--text)" />
        <path d="M96 14 h6 a12 12 0 0 1 0 24 h-8" stroke="var(--text)" strokeWidth="7" fill="none" />
        <ellipse cx="53" cy="7" rx="43" ry="5" fill="var(--primary)" />
      </svg>
      <div className="bg-surface-2 -mt-1 h-2 w-36 rounded-full" />
    </div>
  );
}
