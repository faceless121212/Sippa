import { Check } from "lucide-react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { buttonClass } from "@/components/ui/button";
import { requireAdult } from "@/lib/auth";
import { fulfilCheckout, stripeConfigured } from "@/lib/billing/stripe";
import { parseQuizStart, QUIZ_START_COOKIE, welcomePath } from "@/lib/quiz-start";

export const metadata: Metadata = { title: "Thank you" };

/** Returning from Stripe Checkout: verify the session server-side and fulfil (idempotent). */
export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string; demo?: string; beans?: string }>;
}) {
  const viewer = await requireAdult("/app/plus");
  // Came from a quiz match? "Start chatting" goes back to that character.
  const raw = (await cookies()).get("sippa_next_character")?.value;
  const next = raw && /^[a-z0-9-]{2,64}$/.test(decodeURIComponent(raw)) ? decodeURIComponent(raw) : null;
  // …and in the scene picked on the quiz result, if there was one.
  const quiz = parseQuizStart((await cookies()).get(QUIZ_START_COOKIE)?.value);
  const startHref = next
    ? quiz?.c === next && quiz.s && quiz.v
      ? welcomePath(next, quiz.s, quiz.v)
      : `/app/c/${next}`
    : "/app/explore";
  const { session_id, demo, beans } = await searchParams;
  const result = demo
    ? demoResult(demo, beans)
    : session_id && /^cs_(test|live)_[A-Za-z0-9]+$/.test(session_id) && stripeConfigured()
      ? await fulfilCheckout(session_id, viewer.user.id).catch(() => ({ kind: "error" as const }))
      : { kind: "error" as const };

  const title =
    result.kind === "beans"
      ? `${result.beans} Flowers added 🌸`
      : result.kind === "plus" || result.kind === "ultra"
        ? `Welcome to ${result.kind === "ultra" ? "Sippa Ultra" : "Sippa Plus"} ✨`
        : result.kind === "pending"
          ? "Payment processing…"
          : "We couldn't confirm that payment";
  const body =
    result.kind === "beans"
      ? "Use them for extra creations or messages past your daily limit."
      : result.kind === "ultra"
        ? "Unlimited everything, the longest memory and 1,000 Flowers a month are on. Voice replies are coming soon."
        : result.kind === "plus"
          ? "Unlimited messages and creations are on, plus your monthly Flowers."
          : result.kind === "pending"
            ? "This can take a minute. Refresh this page shortly."
            : "If you were charged, it'll show up shortly — or contact support.";

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center">
      <span className="bg-primary flex h-14 w-14 items-center justify-center rounded-2xl text-black">
        <Check className="h-7 w-7" aria-hidden="true" />
      </span>
      <h1 className="mt-6 text-3xl font-extrabold tracking-[-0.03em]">{title}</h1>
      <p className="text-muted mt-2 text-sm">{body}</p>
      <div className="mt-8 flex gap-2">
        <Link href={startHref} className={buttonClass()}>
          Start chatting
        </Link>
        <Link href="/app/plus" className={buttonClass({ variant: "secondary" })}>
          Plans & Flowers
        </Link>
      </div>
    </div>
  );
}

/** Display-only: the grant already happened in the demo server action. */
function demoResult(kind: string, beans?: string) {
  if (kind === "beans") return { kind: "beans" as const, beans: Number(beans) || 0 };
  if (kind === "plus") return { kind: "plus" as const, active: true };
  if (kind === "ultra") return { kind: "ultra" as const, active: true };
  if (kind === "duplicate") return { kind: "pending" as const };
  return { kind: "error" as const };
}
