"use client";

import {
  Compass,
  Home,
  MessageCircle,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  ShieldCheck,
  User,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { BrandIcon } from "../BrandIcon";
import { NudgePopup } from "./NudgePopup";
import { Logo, LogoMark } from "../Logo";
import { ThemeToggle } from "../ThemeToggle";
import { buttonClass } from "../ui/button";

const NAV = [
  { href: "/app", label: "Home", icon: Home },
  { href: "/app/explore", label: "Explore", icon: Compass },
  { href: "/app/chats", label: "Chats", icon: MessageCircle },
  { href: "/app/create", label: "Create", icon: Plus },
  { href: "/app/profile", label: "Profile", icon: User },
] as const;

const MOBILE = ["/app", "/app/chats", "/app/create", "/app/explore", "/app/profile"];

export type ShellViewer = {
  signedIn: boolean;
  name: string | null;
  plan?: "free" | "plus";
  isAdmin?: boolean;
  nudges?: boolean;
};

function isActive(pathname: string, href: string) {
  return href === "/app" ? pathname === "/app" : pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ viewer, children }: { viewer: ShellViewer; children: ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  // An open conversation takes the whole screen on mobile (it has its own header).
  const inChat = /^\/app\/chats\/[^/]+$/.test(pathname);

  return (
    <div className="min-h-dvh md:flex">
      <a
        href="#app-main"
        className="bg-primary text-on-primary sr-only z-50 rounded-lg px-4 py-2 font-semibold focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>

      {/* Sidebar: icon rail on tablet (collapsible), full on desktop */}
      <aside
        className={cn(
          "border-border bg-bg sticky top-0 hidden h-dvh shrink-0 flex-col border-r px-3 py-4 md:flex",
          collapsed ? "w-[72px]" : "w-[72px] lg:w-60",
        )}
      >
        <div className="flex h-10 items-center justify-between px-2">
          <Link href="/" aria-label="Sippa home" className={cn(collapsed ? "hidden" : "hidden lg:block")}>
            <Logo />
          </Link>
          <Link href="/" aria-label="Sippa home" className={cn(collapsed ? "block" : "lg:hidden")}>
            <LogoMark />
          </Link>
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            className={cn("text-muted hover:bg-surface-2 hidden rounded-lg p-1.5", !collapsed && "lg:block")}
          >
            <PanelLeftClose className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        {collapsed && (
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            aria-label="Expand sidebar"
            aria-expanded={false}
            className="text-muted hover:bg-surface-2 mx-auto mt-2 hidden rounded-lg p-1.5 lg:block"
          >
            <PanelLeftOpen className="h-4 w-4" aria-hidden="true" />
          </button>
        )}

        <nav aria-label="App" className="mt-6">
          <ul className="space-y-1">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = isActive(pathname, href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    title={label}
                    className={cn(
                      "flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition-colors",
                      active ? "bg-surface-2 text-text" : "text-muted hover:bg-surface hover:text-text",
                      href === "/app/create" && !active && "text-text",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-md",
                        href === "/app/create" && "bg-primary text-on-primary",
                      )}
                    >
                      <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                    </span>
                    <span className={cn(collapsed ? "sr-only" : "sr-only lg:not-sr-only")}>{label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="mt-auto space-y-2">
          {viewer.isAdmin && (
            <Link
              href="/app/admin"
              title="Moderation"
              aria-current={isActive(pathname, "/app/admin") ? "page" : undefined}
              className={cn(
                "text-muted hover:bg-surface hover:text-text flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-semibold",
                isActive(pathname, "/app/admin") && "bg-surface-2 text-text",
              )}
            >
              <ShieldCheck className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
              <span className={cn(collapsed ? "sr-only" : "sr-only lg:not-sr-only")}>Moderation</span>
            </Link>
          )}
          {viewer.signedIn && viewer.plan !== "plus" && (
            <Link
              href="/app/plus"
              title="Get Sippa Plus"
              className={cn(
                "group bg-primary relative flex items-center gap-2.5 overflow-hidden rounded-xl p-1.5 font-extrabold text-black shadow-[0_6px_24px_-6px_rgb(195_255_0/0.7)] transition-transform hover:-translate-y-0.5",
                collapsed ? "justify-center" : "justify-center lg:justify-start lg:pr-3",
              )}
            >
              <BrandIcon name="plus" size={34} />
              <span className={cn("leading-tight", collapsed ? "sr-only" : "sr-only lg:not-sr-only")}>
                <span className="block text-sm">Get Plus</span>
                <span className="block text-[11px] font-semibold text-black/60">Unlimited chats</span>
              </span>
              <span
                aria-hidden="true"
                className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/50 to-transparent transition-transform duration-700 group-hover:translate-x-full"
              />
            </Link>
          )}
          <div className={cn("flex", collapsed ? "justify-center" : "justify-center lg:justify-start")}>
            <ThemeToggle />
          </div>
          {!viewer.signedIn && (
            <Link
              href={`/login?next=${encodeURIComponent(pathname)}`}
              className={buttonClass({
                size: "sm",
                className: cn("w-full", collapsed ? "px-0" : "px-0 lg:px-4"),
              })}
            >
              <User className={cn("h-4 w-4", !collapsed && "lg:hidden")} aria-hidden="true" />
              <span className={cn(collapsed ? "sr-only" : "sr-only lg:not-sr-only")}>Log in</span>
            </Link>
          )}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header
          className={cn(
            "border-border bg-bg/90 sticky top-0 z-30 flex h-14 items-center justify-between border-b px-4 backdrop-blur md:hidden",
            inChat && "hidden",
          )}
        >
          <Link href="/" aria-label="Sippa home">
            <Logo />
          </Link>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            {!viewer.signedIn && (
              <Link
                href={`/login?next=${encodeURIComponent(pathname)}`}
                className={buttonClass({ size: "sm" })}
              >
                Log in
              </Link>
            )}
          </div>
        </header>

        <main id="app-main" className={cn("flex-1 md:pb-0", inChat ? "pb-0" : "pb-24")}>
          {children}
        </main>
      </div>

      {/* Mobile bottom nav with centre Create */}
      <nav
        aria-label="App"
        className={cn(
          "border-border bg-bg/95 fixed inset-x-0 bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden",
          inChat && "hidden",
        )}
      >
        <ul className="grid h-16 grid-cols-5 items-center">
          {MOBILE.map((href) => {
            const item = NAV.find((n) => n.href === href)!;
            const Icon = item.icon;
            const active = isActive(pathname, href);
            if (href === "/app/create") {
              return (
                <li key={href} className="flex justify-center">
                  <Link
                    href={href}
                    aria-label="Create a character"
                    aria-current={active ? "page" : undefined}
                    className="bg-primary text-on-primary -mt-6 flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg ring-4 ring-[var(--bg)]"
                  >
                    <Plus className="h-7 w-7" strokeWidth={2.5} aria-hidden="true" />
                  </Link>
                </li>
              );
            }
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold",
                    active ? "text-text" : "text-muted",
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      {viewer.signedIn && viewer.nudges && <NudgePopup />}
    </div>
  );
}
