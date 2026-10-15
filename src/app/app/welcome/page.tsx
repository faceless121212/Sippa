import { Check, MapPin, MessageCircle } from "lucide-react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BuyButton } from "@/components/billing/BuyButton";
import { CharacterAvatar } from "@/components/CharacterAvatar";
import { MessageText } from "@/components/chat/MessageText";
import { buttonClass } from "@/components/ui/button";
import { formatPrice, isPaid, planFeatures, pricing, yearlySavingsPercent } from "@/config/site";
import { getCharacter } from "@/lib/characters";
import { getViewer, requireAdult, viewerIsAdult } from "@/lib/auth";
import { quizChatStart } from "@/lib/quiz-openers";
import { parseQuizStart, QUIZ_START_COOKIE, welcomePath } from "@/lib/quiz-start";
import { signupHref } from "@/lib/signup";
import { startChat } from "../chats/actions";
import { NextCharacter } from "./NextCharacter";

export const metadata: Metadata = { title: "Your chat is ready", robots: { index: false } };

/**
 * After the quiz and sign-up: your match is waiting. Shows the Plus offer once (the deck's
 * paywall step) with an equally clear "Continue free" — never a dead end.
 */
export default async function WelcomePage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string; s?: string; v?: string }>;
}) {
  const { c, s, v } = await searchParams;
  const here = c ? welcomePath(c, s, v as never) : "/app/welcome";
  // Visitors coming from the quiz sign up (not sign in) before meeting their match.
  if (!(await getViewer())) redirect(signupHref(here));
  const viewer = await requireAdult(here);
  if (!c) redirect("/app/explore");
  const character = await getCharacter(c, viewerIsAdult(viewer));
  if (!character) notFound();
  const paid = isPaid(viewer.profile?.plan);
  // From the quiz: the scene and first message picked on the result, and the reply waiting to be sent.
  const start = quizChatStart(character.id, character.category, s, v);
  const pending = parseQuizStart((await cookies()).get(QUIZ_START_COOKIE)?.value);
  const reply = pending?.c === character.id ? pending.r : undefined;
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
          {start && (
            <p className="text-muted mt-2 flex items-center gap-1 text-xs font-semibold">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" /> {start.label}
            </p>
          )}
          <p className="mt-3 text-[15px] leading-relaxed">
            <MessageText text={start?.opener ?? character.firstMessage} />
          </p>
          {reply && (
            <p className="bg-primary text-on-primary mt-3 ml-auto w-fit max-w-[90%] rounded-2xl rounded-br-md px-3 py-2 text-sm font-semibold">
              {reply}
              <span className="block text-[11px] font-normal opacity-70">Sends when you start the chat</span>
            </p>
          )}
        </div>
      </div>

      {paid ? (
        <form action={startChat} className="mt-6">
          <input type="hidden" name="character_id" value={character.id} />
          {start && <input type="hidden" name="scene_id" value={start.sceneId} />}
          {start && <input type="hidden" name="vibe" value={start.vibe} />}
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
            {start && <input type="hidden" name="scene_id" value={start.sceneId} />}
            {start && <input type="hidden" name="vibe" value={start.vibe} />}
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
