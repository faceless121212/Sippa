import { Check, MessageCircle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BuyButton } from "@/components/billing/BuyButton";
import { CharacterAvatar } from "@/components/CharacterAvatar";
import { MessageText } from "@/components/chat/MessageText";
import { buttonClass } from "@/components/ui/button";
import { formatPrice, isPaid, planFeatures, pricing, yearlySavingsPercent } from "@/config/site";
import { getCharacter } from "@/lib/characters";
import { getViewer, requireAdult, viewerIsAdult } from "@/lib/auth";
import { signupHref } from "@/lib/signup";
import { startChat } from "../chats/actions";
import { NextCharacter } from "./NextCharacter";

export const metadata: Metadata = { title: "Your chat is ready", robots: { index: false } };

/**
 * After the quiz and sign-up: your match is waiting. Shows the Plus offer once (the deck's
 * paywall step) with an equally clear "Continue free" — never a dead end.
 */
export default async function WelcomePage({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const { c } = await searchParams;
  const here = `/app/welcome${c ? `?c=${encodeURIComponent(c)}` : ""}`;
  // Visitors coming from the quiz sign up (not sign in) before meeting their match.
  if (!(await getViewer())) redirect(signupHref(here));
  const viewer = await requireAdult(here);
  if (!c) redirect("/app/explore");
  const character = await getCharacter(c, viewerIsAdult(viewer));
  if (!character) notFound();
  const paid = isPaid(viewer.profile?.plan);
  const savings = yearlySavingsPercent(pricing.plusMonthly, pricing.plusYearly);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 md:py-12">
      <NextCharacter id={character.id} />
      <p className="text-muted text-xs font-bold tracking-[0.08em] uppercase">Your match</p>
      <h1 className="mt-1 text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">
        Your chat with {character.name.split(" ")[0]} is ready
      </h1>

      <div className="border-border bg-surface mt-6 flex gap-4 rounded-2xl border p-4">
        <div className="aspect-[3/4] w-24 shrink-0 overflow-hidden rounded-xl">
          <CharacterAvatar
            id={character.id}
            name={character.name}
            src={character.avatarUrl}
            sizes="96px"
            priority
          />
        </div>
        <div className="min-w-0">
          <p className="font-bold">{character.name}</p>
          <p className="text-muted text-sm">{character.hook}</p>
          <p className="mt-3 text-[15px] leading-relaxed">
            <MessageText text={character.firstMessage} />
          </p>
        </div>
      </div>

      {paid ? (
        <form action={startChat} className="mt-6">
          <input type="hidden" name="character_id" value={character.id} />
          <button type="submit" className={buttonClass({ size: "lg", className: "w-full" })}>
            <MessageCircle className="h-4 w-4" aria-hidden="true" /> Start chatting
          </button>
        </form>
      ) : (
        <>
          <section aria-labelledby="offer" className="border-text mt-6 rounded-2xl border-2 p-5">
            <h2 id="offer" className="text-xl font-extrabold">
              Make it unlimited with Sippa Plus
            </h2>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {planFeatures.plus.map((f) => (
                <li key={f} className="flex gap-2 text-sm">
                  <Check className="text-primary-ink mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <div>
                <BuyButton item="plus_yearly">
                  {formatPrice(pricing.plusYearly)} / year · save {savings}%
                </BuyButton>
                <p className="text-muted mt-1 text-center text-xs">
                  Just {formatPrice(pricing.plusYearly / 12)} a month
                </p>
              </div>
              <BuyButton item="plus_monthly" variant="secondary">
                {formatPrice(pricing.plusMonthly)} / month
              </BuyButton>
            </div>
            <p className="text-muted mt-3 text-center text-xs">
              Want the longest memory?{" "}
              <Link href="/app/plus" className="text-text underline underline-offset-2">
                Compare with Ultra
              </Link>
            </p>
          </section>

          <form action={startChat} className="mt-4">
            <input type="hidden" name="character_id" value={character.id} />
            <button
              type="submit"
              className={buttonClass({ variant: "secondary", size: "lg", className: "w-full" })}
            >
              Continue free — {pricing.freeMessagesPerDay} messages a day
            </button>
          </form>
        </>
      )}
    </div>
  );
}
