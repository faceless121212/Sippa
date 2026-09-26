"use client";

import { useActionState } from "react";
import { updatePassword, type AuthState } from "@/app/login/actions";
import { PasswordField } from "@/components/auth/PasswordField";
import { buttonClass } from "@/components/ui/button";

export function ResetForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(updatePassword, { status: "idle" });
  return (
    <form action={action} className="space-y-4">
      <PasswordField label="New password" autoComplete="new-password" showRules />
      <PasswordField id="confirm" name="confirm" label="Repeat new password" autoComplete="new-password" />
      {state.status === "error" && (
        <p role="alert" className="text-lover-ink text-sm font-medium">
          {state.message}
        </p>
      )}
      <button type="submit" disabled={pending} className={buttonClass({ size: "lg", className: "w-full" })}>
        {pending ? "Saving…" : "Save new password"}
      </button>
    </form>
  );
}
