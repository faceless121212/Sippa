"use client";

import { Coffee } from "@/components/icons";
import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { creatorExamples, pickCreatorExample, type CreatorExample } from "@/data/landing";
import { cn } from "@/lib/utils";
import { signupHref } from "@/lib/signup";
import { CharacterAvatar } from "../CharacterAvatar";
import { buttonClass } from "../ui/button";

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
          <h2
            id="creator-title"
            className="font-display text-3xl font-extrabold tracking-[-0.03em] sm:text-[44px] sm:leading-[1.05]"
          >
            Describe it. We brew it. You chat.
          </h2>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
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
              className="border-border bg-bg placeholder:text-text/80 focus:border-text mt-3 w-full resize-none rounded-xl border p-4 text-base focus:outline-none"
            />
            <ul className="mt-3 flex flex-wrap gap-2" aria-label="Examples">
              {suggestions.map((s) => (
                <li key={s}>
                  <button
                    type="button"
                    onClick={() => setInput(s)}
                    className="border-border hover:bg-surface-2 rounded-full border px-3 py-1.5 text-left text-sm font-semibold"
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
              <p className="m-auto max-w-xs text-center font-semibold">
                {brewing ? "Brewing…" : "Your character appears here."}
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
        <p className="bg-primary text-on-primary mb-2 inline-block rounded-md px-2 py-0.5 text-xs font-extrabold">
          Example
        </p>
        <h3 className="font-display text-2xl font-bold">
          {c.name}
          {c.age ? <span className="font-sans text-base font-normal">, {c.age}</span> : null}
        </h3>
        <p className="font-semibold">{c.hook}</p>
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
