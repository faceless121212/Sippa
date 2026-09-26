"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUp, type AuthState } from "@/app/login/actions";
import { inputCls } from "@/components/auth/AuthShell";
import { CheckEmail } from "@/components/auth/CheckEmail";
import { PasswordField } from "@/components/auth/PasswordField";
import { buttonClass } from "@/components/ui/button";

export function SignupForm({ next, maxDob }: { next: string; maxDob: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(signUp, { status: "idle" });
  if (state.status === "check-email" && state.email)
    return <CheckEmail email={state.email} next={next} kind="signup" />;

  return (
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
      {state.status === "error" && (
        <p role="alert" className="text-lover-ink text-sm font-medium">
          {state.message}
        </p>
      )}
      <button type="submit" disabled={pending} className={buttonClass({ size: "lg", className: "w-full" })}>
        {pending ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}
