"use client";

import { useActionState } from "react";
import { buttonClass } from "@/components/ui/button";
import { submitDob, type OnboardingState } from "./actions";

export function OnboardingForm({ next, maxDate }: { next: string; maxDate: string }) {
  const [state, action, pending] = useActionState<OnboardingState, FormData>(submitDob, {});
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="next" value={next} />
      <div className="space-y-2">
        <label htmlFor="display_name" className="text-sm font-semibold">
          What should characters call you? <span className="text-muted font-normal">(optional)</span>
        </label>
        <input
          id="display_name"
          name="display_name"
          maxLength={40}
          autoComplete="nickname"
          className="border-border bg-bg focus:border-text h-12 w-full rounded-lg border px-4 text-base focus:outline-none"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="dob" className="text-sm font-semibold">
          Date of birth
        </label>
        <input
          id="dob"
          name="dob"
          type="date"
          required
          min="1900-01-01"
          max={maxDate}
          aria-describedby="dob-help"
          className="border-border bg-bg focus:border-text h-12 w-full rounded-lg border px-4 text-base focus:outline-none"
        />
        <p id="dob-help" className="text-muted text-xs">
          Sippa is 18+. We use this only to confirm your age.
        </p>
      </div>
      {state.error && (
        <p role="alert" className="text-lover-ink text-sm font-medium">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className={buttonClass({ size: "lg", className: "w-full" })}>
        {pending ? "Saving…" : "Continue"}
      </button>
    </form>
  );
}
