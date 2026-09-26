"use client";

import { useActionState } from "react";
import { buttonClass } from "@/components/ui/button";
import { sendMagicLink, signInWithGoogle, type LoginState } from "./actions";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(sendMagicLink, { status: "idle" });

  if (state.status === "sent") {
    return (
      <div role="status" className="border-border bg-surface rounded-xl border p-5">
        <p className="font-bold">Check your inbox ✉️</p>
        <p className="text-muted mt-1 text-sm">
          We sent a sign-in link to <span className="text-text font-medium">{state.message}</span>. It expires
          in 1 hour.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <form action={signInWithGoogle}>
        <input type="hidden" name="next" value={next} />
        <button
          type="submit"
          className={buttonClass({ variant: "secondary", size: "lg", className: "w-full" })}
        >
          <GoogleIcon />
          Continue with Google
        </button>
      </form>

      <div className="text-muted flex items-center gap-3 text-xs">
        <span className="bg-border h-px flex-1" /> or <span className="bg-border h-px flex-1" />
      </div>

      <form action={action} className="space-y-3">
        <input type="hidden" name="next" value={next} />
        <label htmlFor="login-email" className="text-sm font-semibold">
          Email
        </label>
        <input
          id="login-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          className="border-border bg-bg focus:border-text h-12 w-full rounded-lg border px-4 text-base focus:outline-none"
        />
        <button type="submit" disabled={pending} className={buttonClass({ size: "lg", className: "w-full" })}>
          {pending ? "Sending…" : "Email me a sign-in link"}
        </button>
        {state.status === "error" && (
          <p role="alert" className="text-lover-ink text-sm font-medium">
            {state.message}
          </p>
        )}
      </form>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.7z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3a7.2 7.2 0 0 1-10.7-3.8h-4v3.1A12 12 0 0 0 12 24z"
      />
      <path fill="#FBBC05" d="M5.4 14.3a7.2 7.2 0 0 1 0-4.6V6.6h-4a12 12 0 0 0 0 10.8l4-3.1z" />
      <path
        fill="#EA4335"
        d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.4 6.6l4 3.1A7.2 7.2 0 0 1 12 4.8z"
      />
    </svg>
  );
}
