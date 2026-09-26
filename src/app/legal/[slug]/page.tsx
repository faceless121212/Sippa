import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Logo } from "@/components/Logo";
import { legalPages, legalSlugs, type LegalSlug } from "./content";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return legalSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = legalPages[slug as LegalSlug];
  return page ? { title: page.title } : {};
}

export default async function LegalPage({ params }: Props) {
  const { slug } = await params;
  const page = legalPages[slug as LegalSlug];
  if (!page) notFound();

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <Link href="/" aria-label="Back to Sippa home">
        <Logo />
      </Link>
      <h1 className="font-display mt-10 text-4xl font-semibold tracking-tight">{page.title}</h1>
      <p role="note" className="border-border bg-surface-2 mt-4 rounded-xl border p-4 text-sm">
        <strong>Draft placeholder.</strong> This page has not been reviewed by a lawyer yet and is not legally
        binding.
      </p>
      <div className="mt-8 space-y-8">
        {page.sections.map((s) => (
          <section key={s.heading}>
            <h2 className="font-display text-xl font-semibold">{s.heading}</h2>
            <p className="text-muted mt-2">{s.body}</p>
          </section>
        ))}
      </div>
    </main>
  );
}
