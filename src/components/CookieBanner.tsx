"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { buttonClass } from "./ui/button";

const COOKIE = "sippa_consent";

export type Consent = "essential" | "all";

export function readConsent(): Consent | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE}=(essential|all)`));
  return (match?.[1] as Consent | undefined) ?? null;
}

function writeConsent(value: Consent) {
  const oneYear = 60 * 60 * 24 * 365;
  document.cookie = `${COOKIE}=${value}; Max-Age=${oneYear}; Path=/; SameSite=Lax`;
}

/**
 * GDPR cookie notice. Nothing non-essential runs until the visitor picks
 * "Accept all" (and nothing non-essential exists yet in Phase 1).
 */
export function CookieBanner() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(readConsent() === null);
  }, []);

  if (!open) return null;

  const choose = (value: Consent) => {
    writeConsent(value);
    setOpen(false);
  };

  return (
    <div
      role="region"
      aria-label="Cookie consent"
      className="border-border bg-surface fixed inset-x-3 bottom-3 z-50 mx-auto max-w-xl rounded-xl border p-4 shadow-2xl sm:inset-x-6"
    >
      <p className="text-muted text-sm">
        We use essential cookies to run Sippa. With your OK we&apos;ll also use cookies for measuring and ads
        on the free plan. Read the{" "}
        <Link href="/legal/cookies" className="text-text font-medium underline underline-offset-2">
          cookie policy
        </Link>
        .
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          className={buttonClass({ variant: "secondary", size: "sm" })}
          onClick={() => choose("essential")}
        >
          Essential only
        </button>
        <button type="button" className={buttonClass({ size: "sm" })} onClick={() => choose("all")}>
          Accept all
        </button>
      </div>
    </div>
  );
}
