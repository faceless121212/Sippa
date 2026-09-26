"use client";

import { Coffee, MessageCircle, PenLine } from "lucide-react";
import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { creatorExamples, pickCreatorExample, type CreatorExample } from "@/data/landing";
import { cn } from "@/lib/utils";
import { signupHref } from "@/lib/signup";
import { CharacterAvatar } from "../CharacterAvatar";
import { buttonClass } from "../ui/button";

const steps = [
  { icon: PenLine, title: "Describe", body: "One line — or 5 quick questions." },
  { icon: Coffee, title: "Sippa brews", body: "Face, personality, backstory." },
  { icon: MessageCircle, title: "Chat", body: "Tweak it and start talking." },
];

const suggestions = creatorExamples.map((e) => e.prompt);

export function CreatorShowcase() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<CreatorExample | null>(null);
  const [brewing, setBrewing] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const brew = (e: FormEvent) => {
    e.preventDefault();
    const text = input.trim() || suggestions[0];
    if (!input.trim()) setInput(text);
    setBrewing(true);
    setResult(null);
    // Simulated delay — the landing page never calls the real AI.
    setTimeout(() => {
      setResult(pickCreatorExample(text));
      setBrewing(false);
      resultRef.current?.focus();
    }, 900);
  };

  return (
    <section id="creator" aria-labelledby="creator-title" className="border-border bg-surface/50 border-y">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24">
        <div className="max-w-2xl">
          <p className="text-primary-ink text-sm font-semibold tracking-wide uppercase">
            AI Character Creator
          </p>
          <h2
            id="creator-title"
            className="font-display mt-2 text-3xl font-extrabold tracking-[-0.03em] sm:text-[44px] sm:leading-[1.05]"
          >
            Describe it. We brew it. You chat.
          </h2>
        </div>

        <ol className="mt-8 grid gap-4 sm:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.title} className="border-border bg-surface rounded-xl border p-5">
              <span className="flex items-center gap-3">
                <span className="bg-primary text-on-primary flex h-9 w-9 items-center justify-center rounded-lg">
                  <s.icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="font-display text-lg font-bold">
                  <span className="sr-only">Step {i + 1}: </span>
                  {s.title}
                </span>
              </span>
              <p className="text-muted mt-2 text-sm">{s.body}</p>
            </li>
          ))}
        </ol>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <form onSubmit={brew} className="border-border bg-surface rounded-xl border p-5 sm:p-6">
            <label htmlFor="creator-input" className="font-display text-lg font-bold">
              Who do you want to talk to?
            </label>
            <textarea
              id="creator-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={3}
              maxLength={200}
              placeholder="e.g. a grumpy barista who secretly writes poetry"
              className="border-border bg-bg placeholder:text-muted focus:border-text mt-3 w-full resize-none rounded-xl border p-4 text-base focus:outline-none"
            />
            <p className="text-muted mt-3 text-xs">Try one:</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <li key={s}>
                  <button
                    type="button"
                    onClick={() => setInput(s)}
                    className="border-border text-muted hover:bg-surface-2 hover:text-text rounded-full border px-3 py-1 text-left text-xs"
                  >
                    {s}
                  </button>
                </li>
              ))}
            </ul>
            <button
              type="submit"
              className={buttonClass({ size: "lg", className: "mt-5 w-full" })}
              disabled={brewing}
            >
              <Coffee className="h-4 w-4" aria-hidden="true" />
              {brewing ? "Brewing…" : "Brew"}
            </button>
            <p className="text-muted mt-3 text-xs">Demo — sign up to brew your own for real.</p>
          </form>

          <div
            ref={resultRef}
            tabIndex={-1}
            aria-live="polite"
            aria-busy={brewing}
            className={cn(
              "border-border flex min-h-[320px] rounded-xl border border-dashed p-5 sm:p-6",
              result && "bg-surface border-solid",
            )}
          >
            {result ? (
              <BrewResult example={result} />
            ) : (
              <p className="text-muted m-auto max-w-xs text-center text-sm">
                {brewing ? "Brewing…" : "Your character pours out here."}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function BrewResult({ example }: { example: CreatorExample }) {
  const c = example.character;
  return (
    <div className="flex w-full flex-col gap-4 sm:flex-row">
      <div className="aspect-[3/4] w-32 shrink-0 overflow-hidden rounded-xl sm:w-40">
        <CharacterAvatar id={c.id} name={c.name} priority />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="font-display text-2xl font-bold">
          {c.name}
          {c.age ? <span className="text-muted font-sans text-base font-normal">, {c.age}</span> : null}
        </h3>
        <p className="text-muted text-sm">{c.hook}</p>
        <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Personality traits">
          {c.traits.map((t) => (
            <li
              key={t}
              className="bg-primary/15 text-primary-ink rounded-full px-2 py-0.5 text-xs font-medium"
            >
              {t}
            </li>
          ))}
        </ul>
        <p className="text-muted mt-3 text-xs">
          <span className="text-text font-semibold">Speaks: </span>
          {c.speakingStyle}
        </p>
        <blockquote className="bg-surface-2 mt-3 rounded-xl rounded-tl-sm p-3 text-sm">
          {c.firstMessage}
        </blockquote>
        <Link href={signupHref("/app/create")} className={buttonClass({ size: "sm", className: "mt-4" })}>
          Brew mine now
        </Link>
      </div>
    </div>
  );
}
