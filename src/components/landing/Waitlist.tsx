"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { buttonClass } from "../ui/button";

type Status = { kind: "idle" } | { kind: "sending" } | { kind: "done" } | { kind: "error"; message: string };

export function Waitlist() {
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setStatus({ kind: "sending" });
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.get("email"),
          consent: form.get("consent") === "on",
          website: form.get("website"),
          source: "landing",
        }),
      });
      if (res.ok) {
        setStatus({ kind: "done" });
        return;
      }
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setStatus({ kind: "error", message: data.error ?? "Something went wrong. Please try again." });
    } catch {
      setStatus({ kind: "error", message: "Network error. Please try again." });
    }
  };

  return (
    <section
      id="waitlist"
      aria-labelledby="waitlist-title"
      className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 md:pb-24"
    >
      <div className="border-border bg-surface relative overflow-clip rounded-xl border p-6 sm:p-10 md:p-14">
        <div
          aria-hidden="true"
          className="bg-primary/30 dark:bg-primary/10 pointer-events-none absolute -right-24 -bottom-24 h-72 w-72 rounded-full blur-3xl"
        />
        <div className="relative max-w-xl">
          <h2
            id="waitlist-title"
            className="font-display text-3xl font-extrabold tracking-[-0.03em] sm:text-[44px] sm:leading-[1.05]"
          >
            Get early access
          </h2>
          <p className="text-muted mt-3">Be first in line when Sippa opens.</p>

          {status.kind === "done" ? (
            <p role="status" className="bg-primary text-on-primary mt-8 rounded-xl p-4 font-medium">
              You&apos;re on the list! ☕ We&apos;ll be in touch soon.
            </p>
          ) : (
            <form onSubmit={submit} className="mt-8" noValidate={false}>
              <div className="flex flex-col gap-3 sm:flex-row">
                <label htmlFor="waitlist-email" className="sr-only">
                  Email address
                </label>
                <input
                  id="waitlist-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  maxLength={254}
                  placeholder="you@example.com"
                  className="border-border bg-bg placeholder:text-muted focus:border-text h-12 flex-1 rounded-lg border px-5 text-base focus:outline-none"
                />
                <button
                  type="submit"
                  className={buttonClass({ size: "lg" })}
                  disabled={status.kind === "sending"}
                >
                  {status.kind === "sending" ? "Joining…" : "Join the waitlist"}
                </button>
              </div>
              {/* Honeypot: hidden from people, tempting for bots. */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute top-0 left-0 h-px w-px overflow-hidden opacity-0"
              >
                <label>
                  Website
                  <input name="website" type="text" tabIndex={-1} autoComplete="off" />
                </label>
              </div>
              <label className="text-muted mt-4 flex items-start gap-3 text-sm">
                <input
                  name="consent"
                  type="checkbox"
                  required
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--text)]"
                />
                <span>
                  I&apos;m 18 or older and agree to receive launch emails from Sippa. I&apos;ve read the{" "}
                  <Link href="/legal/privacy" className="text-text font-medium underline underline-offset-2">
                    Privacy Policy
                  </Link>
                  . Unsubscribe any time.
                </span>
              </label>
              {status.kind === "error" && (
                <p role="alert" className="text-lover-ink mt-3 text-sm font-medium">
                  {status.message}
                </p>
              )}
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
