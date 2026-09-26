"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Logo } from "../Logo";
import { ThemeToggle } from "../ThemeToggle";
import { buttonClass } from "../ui/button";

const links = [
  { href: "#vibes", label: "Characters" },
  { href: "#creator", label: "Create" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="border-border bg-bg/85 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" aria-label="Sippa home" className="shrink-0">
          <Logo />
        </Link>

        <nav aria-label="Main" className="ml-6 hidden md:block">
          <ul className="flex items-center gap-1">
            {links.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="text-muted hover:text-text rounded-full px-3 py-2 text-sm">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <ThemeToggle />
          <Link
            href="/app"
            className={buttonClass({ variant: "ghost", size: "sm", className: "hidden sm:inline-flex" })}
          >
            Log in
          </Link>
          <a href="#waitlist" className={buttonClass({ size: "sm", className: "hidden sm:inline-flex" })}>
            Start sipping — free
          </a>
          <button
            type="button"
            className="hover:bg-surface-2 inline-flex h-9 w-9 items-center justify-center rounded-full md:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-nav" aria-label="Mobile" className="border-border border-t px-4 pb-4 md:hidden">
          <ul className="flex flex-col py-2">
            {links.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="hover:bg-surface-2 block rounded-lg px-2 py-3 text-base"
                >
                  {l.label}
                </a>
              </li>
            ))}
            <li>
              <Link href="/app" className="hover:bg-surface-2 block rounded-lg px-2 py-3 text-base">
                Log in
              </Link>
            </li>
          </ul>
          <a href="#waitlist" onClick={() => setOpen(false)} className={buttonClass({ className: "w-full" })}>
            Start sipping — free
          </a>
        </nav>
      )}
    </header>
  );
}
