import type { Metadata } from "next";
import Link from "next/link";
import { LogoMark } from "@/components/Logo";
import { buttonClass } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "The app is brewing",
  robots: { index: false },
};

/** Phase 1 placeholder so landing-page deep links don't 404. Replaced in Phase 2. */
export default function AppPlaceholder() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <LogoMark className="h-14 w-14" />
      <h1 className="font-display mt-6 text-4xl font-bold tracking-tight">The app is still brewing</h1>
      <p className="text-muted mt-3 max-w-md">
        Chatting and the character creator open soon. Join the waitlist and you&apos;ll be first in line.
      </p>
      <Link href="/#waitlist" className={buttonClass({ size: "lg", className: "mt-8" })}>
        Join the waitlist
      </Link>
    </main>
  );
}
