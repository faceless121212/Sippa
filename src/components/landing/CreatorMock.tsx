"use client";

import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { creatorExamples } from "@/data/landing";
import { cn } from "@/lib/utils";
import { CharacterCard } from "../CharacterCard";

/**
 * typing → press (Brew clicked) → brewing (cup fills) → poured (card rises,
 * cup drains) → replying (typing dots) → message → next example.
 */
type Phase = "typing" | "press" | "brewing" | "poured" | "replying" | "message";

const DURATION: Record<Exclude<Phase, "typing">, number> = {
  press: 350,
  brewing: 1400,
  poured: 800,
  replying: 1100,
  message: 3200,
};
const TYPE_MS = 28;
const NEXT: Record<Phase, Phase> = {
  typing: "press",
  press: "brewing",
  brewing: "poured",
  poured: "replying",
  replying: "message",
  message: "typing",
};

/**
 * Decorative hero animation (plain CSS keyframes, see globals.css). The first
 * frame is server-rendered in its finished state; the loop starts after the
 * page settles and never runs for reduced-motion users.
 */
export function CreatorMock() {
  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState(creatorExamples[0].prompt.length);
  const [phase, setPhase] = useState<Phase>("message");
  const [animate, setAnimate] = useState(false);

  const example = creatorExamples[index];
  const prompt = example.prompt;
  const showCard = phase === "poured" || phase === "replying" || phase === "message";
  const previous = [1, 2].map(
    (n) => creatorExamples[(index + creatorExamples.length - n) % creatorExamples.length],
  );

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const start = setTimeout(() => setAnimate(true), 1800);
    return () => clearTimeout(start);
  }, []);

  useEffect(() => {
    if (!animate) return;
    let timer: ReturnType<typeof setTimeout>;
    if (phase === "typing") {
      timer =
        typed < prompt.length
          ? setTimeout(() => setTyped((t) => t + 1), TYPE_MS + (typed % 5) * 6)
          : setTimeout(() => setPhase("press"), 350);
    } else {
      timer = setTimeout(() => {
        if (phase === "message") {
          setIndex((i) => (i + 1) % creatorExamples.length);
          setTyped(0);
        }
        setPhase(NEXT[phase]);
      }, DURATION[phase]);
    }
    return () => clearTimeout(timer);
  }, [animate, phase, typed, prompt.length]);

  return (
    <figure className="relative mx-auto w-full max-w-md">
      <figcaption className="sr-only">
        Animated example: someone describes a character in one sentence and Sippa creates it.
      </figcaption>
      <div
        aria-hidden="true"
        className="border-border bg-surface rounded-2xl border p-4 shadow-2xl shadow-black/10 sm:p-5"
      >
        {/* prompt box */}
        <div className="border-border bg-bg flex items-center gap-2 rounded-xl border py-2 pr-2 pl-3.5">
          <Sparkles className="text-primary-ink h-4 w-4 shrink-0" />
          <span className="min-h-10 flex-1 py-1 text-sm leading-snug sm:min-h-0">
            {prompt.slice(0, typed)}
            {phase === "typing" && (
              <span className="bg-text ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 animate-pulse" />
            )}
          </span>
          <span
            className={cn(
              "bg-primary text-on-primary shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold transition-transform duration-150",
              phase === "press" && "scale-90",
              phase === "brewing" && "animate-pulse",
            )}
          >
            Brew
          </span>
        </div>

        {/* stage */}
        <div className="relative mt-4 flex h-[380px] items-end justify-center overflow-x-clip sm:h-[460px]">
          {/* fanned deck of earlier results */}
          {animate &&
            previous.map((p, i) => (
              <div
                key={p.character.id}
                className={cn(
                  "absolute top-6 w-[50%] max-w-[190px] transition-all duration-700 ease-out",
                  showCard
                    ? i === 0
                      ? "-translate-x-[62%] -rotate-[8deg] opacity-70"
                      : "translate-x-[62%] rotate-[8deg] opacity-50"
                    : "translate-x-0 rotate-0 opacity-0",
                )}
              >
                <CharacterCard character={p.character} />
              </div>
            ))}

          {!showCard && (
            <div
              className={cn(
                "border-border bg-bg absolute top-0 z-20 flex aspect-[3/4] w-[62%] max-w-[250px] flex-col justify-end gap-2 rounded-xl border-2 border-dashed p-3 transition-colors",
                phase === "brewing" && "border-primary-ink/60 animate-pulse",
              )}
            >
              <span className="bg-surface-2 mx-auto mt-10 mb-auto h-20 w-20 rounded-full" />
              <span className="bg-surface-2 h-3 w-1/2 rounded" />
              <span className="bg-surface-2 h-2 w-4/5 rounded" />
              <span className="flex gap-1">
                <span className="bg-surface-2 h-3 w-10 rounded" />
                <span className="bg-surface-2 h-3 w-12 rounded" />
              </span>
            </div>
          )}

          {showCard && (
            <div
              key={example.character.id}
              className={cn("absolute top-0 z-20 w-[62%] max-w-[250px]", animate && "animate-pour")}
            >
              <div className="relative overflow-hidden rounded-xl shadow-2xl shadow-black/30">
                <CharacterCard character={example.character} priority={index === 0} />
                {animate && <span className="animate-shine pointer-events-none absolute inset-0" />}
              </div>

              {/* first message */}
              {(phase === "replying" || phase === "message") && (
                <div
                  className={cn(
                    "border-border bg-bg absolute -right-4 -bottom-10 w-[90%] rounded-xl rounded-tl-sm border p-2.5 text-[11px] leading-snug shadow-lg sm:-right-12",
                    animate && "animate-pop",
                  )}
                >
                  {phase === "replying" ? (
                    <span className="flex gap-1 py-1">
                      {[0, 1, 2].map((d) => (
                        <span
                          key={d}
                          className="bg-muted h-1.5 w-1.5 animate-bounce rounded-full"
                          style={{ animationDelay: `${d * 120}ms` }}
                        />
                      ))}
                    </span>
                  ) : (
                    <span className="line-clamp-3">{example.character.firstMessage}</span>
                  )}
                </div>
              )}
            </div>
          )}
          <Cup phase={phase} animate={animate} />
        </div>
      </div>
    </figure>
  );
}

function Cup({ phase, animate }: { phase: Phase; animate: boolean }) {
  const brewing = phase === "brewing";
  const liquid = !animate
    ? "translate-y-[44px]"
    : brewing
      ? "animate-fill"
      : phase === "poured"
        ? "animate-drain"
        : "translate-y-[44px]";

  return (
    <div className="relative z-10 flex flex-col items-center">
      {/* steam */}
      <div className="flex h-12 items-end gap-2.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={cn("bg-muted block h-2 w-1.5 rounded-full opacity-20", brewing && "animate-steam")}
            style={{ animationDelay: `${i * 200}ms` }}
          />
        ))}
      </div>
      <svg viewBox="0 0 120 70" className="w-28 overflow-visible">
        <defs>
          <clipPath id="cup-inside">
            <path d="M15 11 h76 v21 a25 25 0 0 1 -25 25 h-26 a25 25 0 0 1 -25 -25 z" />
          </clipPath>
        </defs>
        <path
          d="M10 6 h86 v26 a30 30 0 0 1 -30 30 h-26 a30 30 0 0 1 -30 -30 z"
          fill="var(--text)"
          className={cn(brewing && "animate-wobble")}
          style={{ transformOrigin: "53px 62px" }}
        />
        <path d="M96 14 h6 a12 12 0 0 1 0 24 h-8" stroke="var(--text)" strokeWidth="7" fill="none" />
        <g clipPath="url(#cup-inside)">
          <rect x="10" y="10" width="90" height="50" fill="var(--primary)" className={liquid} />
        </g>
      </svg>
      <div className="bg-surface-2 -mt-1 h-2 w-36 rounded-full" />
    </div>
  );
}
