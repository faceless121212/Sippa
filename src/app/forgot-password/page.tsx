"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordReset, type AuthState } from "@/app/login/actions";
import { AuthShell, inputCls } from "@/components/auth/AuthShell";
import { CheckEmail } from "@/components/auth/CheckEmail";
import { buttonClass } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState<AuthState, FormData>(requestPasswordReset, {
    status: "idle",
  });
  return (
    <AuthShell
      title="Reset your password"
      subtitle="We'll email you a link to set a new one."
      footer={
        <Link href="/login" className="text-text font-semibold underline underline-offset-2">
          Back to sign in
        </Link>
      }
    >
      {state.status === "check-email" && state.email ? (
        <CheckEmail email={state.email} next="/app" kind="reset" />
      ) : (
        <form action={action} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-semibold">
              Email
            </label>
            <input id="email" name="email" type="email" required autoComplete="email" className={inputCls} />
          </div>
          {state.status === "error" && (
            <p role="alert" className="text-lover-ink text-sm font-medium">
              {state.message}
            </p>
          )}
          <button
            type="submit"
            disabled={pending}
            className={buttonClass({ size: "lg", className: "w-full" })}
          >
            {pending ? "Sending…" : "Send reset link"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
