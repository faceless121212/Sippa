import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { appComingSoon } from "@/lib/paths";
import { signupHref } from "@/lib/signup";
import { BrandIcon } from "../BrandIcon";

/** Final call to action: every landing CTA leads to sign-up. */
export function SignupCta() {
  return (
    // On the static landing before the app is live, every app button jumps here.
    <section
      id={appComingSoon ? "coming-soon" : "join"}
      aria-labelledby="join-title"
      className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 md:pb-24"
    >
      <div className="bg-primary relative overflow-hidden rounded-3xl p-8 text-black sm:p-12">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgb(0_0_0/0.09)_1.5px,transparent_1.5px)] bg-[size:18px_18px]"
        />
        <div className="relative flex flex-col gap-8 sm:flex-row sm:items-center">
          <div className="flex-1">
            <h2
              id="join-title"
              className="text-3xl leading-[1.05] font-extrabold tracking-[-0.03em] sm:text-5xl"
            >
              Your first cup is on us.
            </h2>
            <p className="mt-3 max-w-md text-base font-medium text-black/70">
              Free account, 30 messages a day, 3 characters to brew. No card needed.
            </p>
            {appComingSoon ? (
              <p className="mt-6 inline-flex rounded-xl bg-black px-5 py-3 font-bold text-white">
                Opening soon — the app launches shortly.
              </p>
            ) : (
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href={signupHref("/app/create")}
                  className="group inline-flex items-center gap-2 rounded-xl bg-black px-5 py-3 font-bold text-white transition-transform hover:-translate-y-0.5"
                >
                  Create free account
                  <ArrowRight
                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </Link>
                <Link
                  href={signupHref("/app/explore")}
                  className="inline-flex items-center rounded-xl border-2 border-black px-5 py-3 font-bold transition-colors hover:bg-black/5"
                >
                  Meet the characters
                </Link>
              </div>
            )}
            <p className="mt-4 text-xs font-medium text-black/60">
              18+ only · You&apos;re always chatting with an AI
            </p>
          </div>
          <div className="relative hidden h-44 w-52 shrink-0 sm:block" aria-hidden="true">
            <BrandIcon name="cup" size={150} className="absolute top-0 left-0 rotate-[-6deg] shadow-2xl" />
            <BrandIcon
              name="flowers"
              size={84}
              className="absolute right-0 bottom-0 rotate-[8deg] shadow-xl ring-4 ring-[var(--primary)]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
