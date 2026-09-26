"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

/** Icons swap via the `.dark` class so there's no hydration mismatch. */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <button
      type="button"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="text-muted hover:bg-surface-2 hover:text-text inline-flex h-9 w-9 items-center justify-center rounded-lg"
      aria-label="Toggle light and dark theme"
    >
      <Moon className="h-5 w-5 dark:hidden" aria-hidden="true" />
      <Sun className="hidden h-5 w-5 dark:block" aria-hidden="true" />
    </button>
  );
}
