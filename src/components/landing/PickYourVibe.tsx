"use client";

import Link from "next/link";
import { useRef, useState, type KeyboardEvent } from "react";
import { categories, categoryStyles, type CategoryId } from "@/config/categories";
import { charactersByCategory } from "@/data/landing";
import { signupHref } from "@/lib/signup";
import { cn } from "@/lib/utils";
import { CharacterCard } from "../CharacterCard";
import { buttonClass } from "../ui/button";

/** Accessible tabs (WAI-ARIA tabs pattern) choosing a category. */
export function PickYourVibe() {
  const [active, setActive] = useState<CategoryId>("lover");
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const last = categories.length - 1;
    const next =
      e.key === "ArrowRight"
        ? i === last
          ? 0
          : i + 1
        : e.key === "ArrowLeft"
          ? i === 0
            ? last
            : i - 1
          : e.key === "Home"
            ? 0
            : e.key === "End"
              ? last
              : null;
    if (next === null) return;
    e.preventDefault();
    setActive(categories[next].id);
    tabRefs.current[next]?.focus();
  };

  const current = categories.find((c) => c.id === active)!;

  return (
    <section
      id="vibes"
      aria-labelledby="vibes-title"
      className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24"
    >
      <div className="max-w-2xl">
        <p className="text-muted mb-3 inline-flex items-center gap-1.5 text-xs font-semibold tracking-[0.08em] uppercase">
          <span className="bg-primary h-1.5 w-1.5 rounded-full ring-1 ring-black/20" aria-hidden="true" />
          Characters
        </p>
        <h2
          id="vibes-title"
          className="font-display text-3xl font-extrabold tracking-[-0.03em] sm:text-[44px] sm:leading-[1.05]"
        >
          Pick your vibe
        </h2>
        <p className="text-muted mt-3">Three ways to sip.</p>
      </div>

      <div role="tablist" aria-label="Character categories" className="mt-8 grid gap-3 sm:grid-cols-3">
        {categories.map((cat, i) => {
          const selected = cat.id === active;
          const s = categoryStyles[cat.id];
          return (
            <button
              key={cat.id}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              role="tab"
              id={`tab-${cat.id}`}
              aria-selected={selected}
              aria-controls={`panel-${cat.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(cat.id)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={cn(
                "relative rounded-xl border p-5 text-left transition-colors",
                selected
                  ? "border-text bg-surface shadow-[0_0_0_1px_var(--text)]"
                  : "border-border bg-bg hover:bg-surface",
              )}
            >
              <span className="flex items-center gap-2">
                <span
                  className={cn("flex h-9 w-9 items-center justify-center rounded-lg text-lg", s.softBg)}
                  aria-hidden="true"
                >
                  {cat.emoji}
                </span>
                <span className={cn("font-display text-xl font-bold", s.ink)}>{cat.label}</span>
                {cat.adultsOnly && (
                  <span className="border-border text-muted ml-auto rounded-md border px-1.5 py-0.5 text-[11px] font-medium">
                    18+
                  </span>
                )}
              </span>
              <span className="text-muted mt-2 block text-sm">{cat.blurb}</span>
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`panel-${active}`}
        aria-labelledby={`tab-${active}`}
        tabIndex={0}
        className="mt-8 rounded-xl"
      >
        <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {charactersByCategory(active).map((c, i) => (
            <li key={c.id} className="animate-rise" style={{ animationDelay: `${i * 70}ms` }}>
              <CharacterCard character={c} className="h-full" />
            </li>
          ))}
        </ul>
        <ul className="no-scrollbar mt-5 flex gap-2 overflow-x-auto" aria-label={`${current.label} sub-tags`}>
          {current.subTags.map((t) => (
            <li
              key={t}
              className={cn(
                "border-border text-muted shrink-0 rounded-md border px-2.5 py-1 text-xs font-medium",
              )}
            >
              {t}
            </li>
          ))}
        </ul>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link href={signupHref(`/app/explore?category=${active}`)} className={buttonClass()}>
            Start chatting with a {current.label.toLowerCase()}
          </Link>
          <Link
            href={signupHref(`/app/create?category=${active}`)}
            className={buttonClass({ variant: "secondary" })}
          >
            Create your own
          </Link>
        </div>
        {active === "famous" && (
          <p className="text-muted mt-4 text-xs">
            Famous characters are inspired by historical figures who died long ago, or are fictional
            archetypes. No living celebrities, ever.
          </p>
        )}
      </div>
    </section>
  );
}
