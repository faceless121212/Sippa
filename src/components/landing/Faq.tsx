import { ChevronDown } from "lucide-react";
import { faqs } from "@/data/landing";

export function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="mx-auto max-w-3xl px-4 py-16 sm:px-6 md:py-24">
      <h2
        id="faq-title"
        className="font-display text-center text-3xl font-semibold tracking-tight sm:text-4xl"
      >
        Questions, answered
      </h2>
      <div className="divide-border border-border bg-surface mt-10 divide-y rounded-3xl border">
        {faqs.map((f) => (
          <details key={f.q} className="group px-5 sm:px-6">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 font-medium [&::-webkit-details-marker]:hidden">
              {f.q}
              <ChevronDown
                className="text-muted h-5 w-5 shrink-0 transition-transform group-open:rotate-180"
                aria-hidden="true"
              />
            </summary>
            <p className="text-muted pb-5 text-sm">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
