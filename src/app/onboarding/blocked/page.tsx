import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";

export const metadata: Metadata = { title: "Sorry", robots: { index: false } };

export default function BlockedPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <Logo />
      <h1 className="mt-8 text-3xl font-extrabold tracking-[-0.03em]">Sippa is for adults only</h1>
      <p className="text-muted mt-3 max-w-sm text-sm">
        You need to be 18 or older to use Sippa, so we didn&apos;t create an account and haven&apos;t kept
        your details.
      </p>
      <Link href="/" className="mt-8 text-sm font-semibold underline underline-offset-4">
        Back to home
      </Link>
    </main>
  );
}
