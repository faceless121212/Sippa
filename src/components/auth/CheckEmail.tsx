"use client";

import { useActionState } from "react";
import { resendConfirmation, type AuthState } from "@/app/login/actions";

/** "Check your inbox" panel with a resend button (for sign-up confirmation). */
export function CheckEmail({ email, next, kind }: { email: string; next: string; kind: "signup" | "reset" }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(resendConfirmation, {
    status: "idle",
  });
  return (
    <div role="status" className="border-border bg-surface rounded-xl border p-5">
      <p className="font-bold">Check your inbox ✉️</p>
      <p className="text-muted mt-1 text-sm">
        {kind === "signup" ? "We sent a confirmation link to " : "If there's an account for "}
        <span className="text-text font-medium">{email}</span>
        {kind === "signup"
          ? ". Click it to activate your account — then you're in."
          : ", we sent a link to reset your password."}
      </p>
      {kind === "signup" && (
        <form action={action} className="mt-3">
          <input type="hidden" name="email" value={email} />
          <input type="hidden" name="next" value={next} />
          <button
            type="submit"
            disabled={pending}
            className="text-sm font-semibold underline underline-offset-2 disabled:opacity-50"
          >
            {pending ? "Sending…" : state.status === "check-email" ? "Sent again ✓" : "Didn't get it? Resend"}
          </button>
          {state.status === "error" && <p className="text-lover-ink mt-1 text-xs">{state.message}</p>}
        </form>
      )}
      <p className="text-muted mt-3 text-xs">Check your spam folder too. Links expire after 1 hour.</p>
    </div>
  );
}
