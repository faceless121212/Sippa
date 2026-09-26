import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";

export const metadata: Metadata = { title: "Account deleted", robots: { index: false } };

export default function AccountDeletedPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <Logo />
      <h1 className="mt-8 text-3xl font-extrabold tracking-[-0.03em]">Your account is deleted</h1>
      <p className="text-muted mt-3 max-w-sm text-sm">
        Your chats, characters, portraits and purchases history have been permanently erased. Thanks for
        sipping with us.
      </p>
      <Link href="/" className="mt-8 text-sm font-semibold underline underline-offset-4">
        Back to home
      </Link>
    </main>
  );
}
