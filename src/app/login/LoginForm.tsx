"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { inputCls } from "@/components/auth/AuthShell";
import { CheckEmail } from "@/components/auth/CheckEmail";
import { PasswordField } from "@/components/auth/PasswordField";
import { buttonClass } from "@/components/ui/button";
import {
  resendConfirmation,
  sendMagicLink,
  signInWithPassword,
  type AuthState,
  type LoginState,
} from "./actions";

export function LoginForm({ next }: { next: string }) {
  const [mode, setMode] = useState<"password" | "link">("password");
  const [state, action, pending] = useActionState<AuthState, FormData>(signInWithPassword, {
    status: "idle",
  });
  const [linkState, linkAction, linkPending] = useActionState<LoginState, FormData>(sendMagicLink, {
    status: "idle",
  });
  const [resend, resendAction, resendPending] = useActionState<AuthState, FormData>(resendConfirmation, {
    status: "idle",
  });

  if (resend.status === "check-email" && resend.email) {
    return <CheckEmail email={resend.email} next={next} kind="signup" />;
  }

  if (mode === "link") {
    if (linkState.status === "sent") {
      return (
        <div role="status" className="border-border bg-surface rounded-xl border p-5">
          <p className="font-bold">Check your inbox ✉️</p>
          <p className="text-muted mt-1 text-sm">
            We sent a sign-in link to <span className="text-text font-medium">{linkState.message}</span>.
          </p>
        </div>
      );
    }
    return (
      <form action={linkAction} className="space-y-3">
        <input type="hidden" name="next" value={next} />
        <label htmlFor="link-email" className="text-sm font-semibold">
          Email
        </label>
        <input id="link-email" name="email" type="email" required autoComplete="email" className={inputCls} />
        <button
          type="submit"
          disabled={linkPending}
          className={buttonClass({ size: "lg", className: "w-full" })}
        >
          {linkPending ? "Sending…" : "Email me a sign-in link"}
        </button>
        {linkState.status === "error" && (
          <p role="alert" className="text-lover-ink text-sm font-medium">
            {linkState.message}
          </p>
        )}
        <button
          type="button"
          onClick={() => setMode("password")}
          className="text-muted hover:text-text w-full text-center text-sm"
        >
          Use my password instead
        </button>
      </form>
    );
  }

  return (
    <div className="space-y-3">
      <form action={action} className="space-y-4">
        <input type="hidden" name="next" value={next} />
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
            defaultValue={state.email}
            className={inputCls}
          />
        </div>
        <PasswordField autoComplete="current-password" />
        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-muted hover:text-text text-sm font-medium">
            Forgot password?
          </Link>
        </div>
        {state.status === "error" && (
          <p role="alert" className="text-lover-ink text-sm font-medium">
            {state.message}
          </p>
        )}
        <button type="submit" disabled={pending} className={buttonClass({ size: "lg", className: "w-full" })}>
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
      {state.unconfirmed && state.email && (
        <form action={resendAction}>
          <input type="hidden" name="email" value={state.email} />
          <input type="hidden" name="next" value={next} />
          <button
            type="submit"
            disabled={resendPending}
            className={buttonClass({ variant: "secondary", className: "w-full" })}
          >
            {resendPending ? "Sending…" : "Resend confirmation email"}
          </button>
        </form>
      )}
      <button
        type="button"
        onClick={() => setMode("link")}
        className="text-muted hover:text-text w-full text-center text-sm"
      >
        Email me a sign-in link instead
      </button>
    </div>
  );
}
