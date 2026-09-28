"use client";

import { Check, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { inputCls } from "./AuthShell";

const RULES = [
  { label: "8+ characters", test: (v: string) => v.length >= 8 },
  { label: "a letter", test: (v: string) => /[A-Za-z]/.test(v) },
  { label: "a number", test: (v: string) => /\d/.test(v) },
];

export function PasswordField({
  id = "password",
  name = "password",
  label = "Password",
  autoComplete,
  showRules,
}: {
  id?: string;
  name?: string;
  label?: string;
  autoComplete: "new-password" | "current-password";
  showRules?: boolean;
}) {
  const [value, setValue] = useState("");
  const [visible, setVisible] = useState(false);
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          required
          minLength={showRules ? 8 : 1}
          maxLength={72}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-describedby={showRules ? `${id}-rules` : undefined}
          className={cn(inputCls, "pr-12")}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="text-muted hover:text-text absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-2"
        >
          {visible ? (
            <EyeOff className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Eye className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>
      {showRules && (
        <ul id={`${id}-rules`} className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
          {RULES.map((r) => {
            const ok = r.test(value);
            return (
              <li
                key={r.label}
                className={cn("flex items-center gap-1", ok ? "text-friend-ink" : "text-muted")}
              >
                {ok ? (
                  <Check className="h-3 w-3" aria-hidden="true" />
                ) : (
                  // A hollow dot, so unmet rules don't read as already ticked off.
                  <span className="flex h-3 w-3 items-center justify-center" aria-hidden="true">
                    <span className="h-1.5 w-1.5 rounded-full border border-current" />
                  </span>
                )}
                {r.label}
                <span className="sr-only">{ok ? " — done" : " — missing"}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
