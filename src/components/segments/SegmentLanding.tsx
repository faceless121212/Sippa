import { Check, Sparkles } from "lucide-react";
import Link from "next/link";
import { CharacterCard } from "@/components/CharacterCard";
import { Reveal } from "@/components/Reveal";
import { Faq } from "@/components/landing/Faq";
import { Footer } from "@/components/landing/Footer";
import { Header } from "@/components/landing/Header";
import { Pricing } from "@/components/landing/Pricing";
import { buttonClass } from "@/components/ui/button";
import { TrustChips } from "./TrustChips";
import { segments, type SegmentId } from "@/config/segments";
import { seedCharacters } from "@/data/characters";
import { exploreHref } from "@/lib/explore-params";
import { signupHref } from "@/lib/signup";
import { SegmentMark } from "./SegmentMark";

/** A landing page for one audience: its own headline, characters and quiz (one per ad campaign). */
export function SegmentLanding({ id }: { id: SegmentId }) {
  const seg = segments[id];
  // Curated first, then the newest additions, so each page shows a varied, fresh line-up.
  const cast = seedCharacters
    .filter((c) => c.category === seg.category)
    .sort((a, b) => Number(b.badges?.includes("pick") ?? 0) - Number(a.badges?.includes("pick") ?? 0))
    .slice(0, 8);

  return (
    <>
      <SegmentMark segment={id} />
      <Header />
      <main id="main">
        <section className="border-border relative border-b" aria-labelledby="segment-title">
          <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 md:py-20 lg:grid-cols-[1.1fr_1fr]">
            <div>
              <p className="border-border bg-bg text-text mb-5 inline-flex items-center gap-2 rounded-lg border px-2.5 py-1 text-xs font-medium">
                <span className="bg-primary h-2 w-2 rounded-full ring-2 ring-black/10" aria-hidden="true" />
                {seg.eyebrow}
              </p>
              <h1
                id="segment-title"
                className="text-[40px] leading-[1.02] font-extrabold tracking-[-0.035em] text-balance sm:text-6xl"
              >
                {seg.title}{" "}
                <span className="bg-primary text-on-primary rounded-lg box-decoration-clone px-2">
                  {seg.highlight}
                </span>
              </h1>
              <p className="text-text mt-6 max-w-xl text-lg leading-relaxed">{seg.subtitle}</p>
              <ul className="mt-6 space-y-2">
                {seg.points.map((p) => (
                  <li key={p} className="flex gap-2 text-sm">
                    <Check className="text-primary-ink mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    {p}
                  </li>
                ))}
              </ul>
              <TrustChips className="mt-6" />
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <Link href={`/quiz/${id}`} className={buttonClass({ size: "lg" })}>
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  {seg.quizTitle}
                </Link>
                <Link
                  href={signupHref(exploreHref({ category: seg.category }))}
                  className={buttonClass({ variant: "secondary", size: "lg" })}
                >
                  Browse characters
                </Link>
              </div>
              {seg.adultsOnly && (
                <p className="text-text mt-4 text-xs">
                  18+ only. Every character is a fictional adult, and always an AI.
                </p>
              )}
            </div>
            <ul className="grid grid-cols-2 gap-3" aria-label={`Some of our ${seg.eyebrow} characters`}>
              {cast.slice(0, 4).map((c, i) => (
                <li key={c.id} className={i % 2 ? "translate-y-6" : ""}>
                  <CharacterCard character={c} priority={i < 2} />
                </li>
              ))}
            </ul>
          </div>
        </section>

        <Reveal>
          <section aria-labelledby="how-title" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <h2 id="how-title" className="text-3xl font-extrabold tracking-[-0.03em]">
              How it works
            </h2>
            <ol className="mt-6 grid gap-4 md:grid-cols-3">
              {[
                [
                  "Take the 2-minute quiz",
                  "Five quick questions about what you're looking for. No sign-up.",
                ],
                ["Meet your match", "We pick the character who fits you best — see who it is right away."],
                [
                  "Start chatting",
                  "Create a free account and pick up the conversation. They'll remember you.",
                ],
              ].map(([t, d], i) => (
                <li key={t} className="border-border bg-surface rounded-xl border p-5">
                  <span className="bg-primary text-on-primary flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold">
                    {i + 1}
                  </span>
                  <h3 className="mt-3 font-extrabold">{t}</h3>
                  <p className="text-text mt-1 text-sm">{d}</p>
                </li>
              ))}
            </ol>
          </section>
        </Reveal>

        <Reveal>
          <section aria-labelledby="cast-title" className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
            <h2 id="cast-title" className="text-3xl font-extrabold tracking-[-0.03em]">
              Who you could meet
            </h2>
            <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {cast.map((c) => (
                <li key={c.id}>
                  <CharacterCard character={c} />
                </li>
              ))}
            </ul>
            <div className="mt-8 text-center">
              <Link href={`/quiz/${id}`} className={buttonClass({ size: "lg" })}>
                {seg.quizTitle}
              </Link>
            </div>
          </section>
        </Reveal>
        <Reveal>
          <Pricing />
        </Reveal>
        <Reveal>
          <Faq />
        </Reveal>
      </main>
      <Footer />
    </>
  );
}
