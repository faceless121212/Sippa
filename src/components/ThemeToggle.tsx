"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

/** Icons swap via the `.light` class so there's no hydration mismatch. */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <button
      type="button"
      onClick={() => setTheme(resolvedTheme === "light" ? "dark" : "light")}
      className="text-muted hover:bg-surface-2 hover:text-text inline-flex h-9 w-9 items-center justify-center rounded-full"
      aria-label="Toggle light and dark theme"
    >
      <Sun className="light:hidden h-5 w-5" aria-hidden="true" />
      <Moon className="light:block hidden h-5 w-5" aria-hidden="true" />
    </button>
  );
}
