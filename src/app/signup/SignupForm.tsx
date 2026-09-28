"use client";

import Link from "next/link";
import { useActionState } from "react";
import { resendConfirmation, signUp, type AuthState } from "@/app/login/actions";
import { inputCls } from "@/components/auth/AuthShell";
import { CheckEmail } from "@/components/auth/CheckEmail";
import { PasswordField } from "@/components/auth/PasswordField";
import { buttonClass } from "@/components/ui/button";

export function SignupForm({ next, maxDob }: { next: string; maxDob: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(signUp, { status: "idle" });
  const [resent, resendAction, resending] = useActionState<AuthState, FormData>(resendConfirmation, {
    status: "idle",
  });
  if (resent.status === "check-email" && resent.email)
    return <CheckEmail email={resent.email} next={next} kind="signup" />;
  if (state.status === "check-email" && state.email)
    return <CheckEmail email={state.email} next={next} kind="signup" />;

  return (
    <>
      <form action={action} className="space-y-4" noValidate={false}>
        <input type="hidden" name="next" value={next} />
        <div className="space-y-1.5">
          <label htmlFor="displayName" className="text-sm font-semibold">
            Name <span className="text-muted font-normal">(what characters call you)</span>
          </label>
          <input
            id="displayName"
            name="displayName"
            maxLength={40}
            autoComplete="nickname"
            className={inputCls}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-semibold">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            maxLength={254}
            defaultValue={state.email}
            key={state.email ?? "email"}
            className={inputCls}
          />
        </div>
        <PasswordField autoComplete="new-password" showRules />
        <div className="space-y-1.5">
          <label htmlFor="dob" className="text-sm font-semibold">
            Date of birth
          </label>
          <input
            id="dob"
            name="dob"
            type="date"
            required
            min="1900-01-01"
            max={maxDob}
            aria-describedby="dob-help"
            className={inputCls}
          />
          <p id="dob-help" className="text-muted text-xs">
            Sippa is for adults 18+. We only use this to check your age.
          </p>
        </div>
        <label className="flex items-start gap-3 text-sm">
          <input
            name="terms"
            type="checkbox"
            required
            className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--text)]"
          />
          <span className="text-muted">
            I&apos;m 18 or older and agree to the{" "}
            <Link href="/legal/terms" className="text-text underline underline-offset-2">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/legal/privacy" className="text-text underline underline-offset-2">
              Privacy Policy
            </Link>
            .
          </span>
        </label>
        {state.status === "error" && !state.exists && (
          <p role="alert" className="text-lover-ink text-sm font-medium">
            {state.message}
          </p>
        )}
        <button type="submit" disabled={pending} className={buttonClass({ size: "lg", className: "w-full" })}>
          {pending ? "Creating account…" : "Create account"}
        </button>
      </form>
      {state.exists && (
        <div role="alert" className="border-border bg-surface mt-4 space-y-2 rounded-xl border p-3 text-sm">
          <p className="font-semibold">{state.message}</p>
          {state.exists === "confirmed" ? (
            <p className="text-muted">
              <Link
                href={`/login?next=${encodeURIComponent(next)}`}
                className="text-text font-semibold underline underline-offset-2"
              >
                Sign in
              </Link>{" "}
              instead, or{" "}
              <Link href="/forgot-password" className="text-text font-semibold underline underline-offset-2">
                reset your password
              </Link>
              .
            </p>
          ) : (
            // Its own form: the email travels in a hidden field, so it survives the main form resetting.
            <form action={resendAction}>
              <input type="hidden" name="email" value={state.email ?? ""} />
              <input type="hidden" name="next" value={next} />
              <button
                type="submit"
                disabled={resending}
                className={buttonClass({ variant: "secondary", size: "sm" })}
              >
                {resending ? "Sending…" : "Resend confirmation email"}
              </button>
            </form>
          )}
        </div>
      )}
    </>
  );
}
