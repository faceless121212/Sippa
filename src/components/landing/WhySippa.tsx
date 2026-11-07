import { Ban, Brain, Lock } from "@/components/icons";
import { whySippa } from "@/data/landing";

const icons = {
  brain: Brain,
  ban: Ban,
  lock: Lock,
} as const;

export function WhySippa() {
  return (
    <section id="why" aria-labelledby="why-title" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24">
      <h2
        id="why-title"
        className="font-display text-3xl font-extrabold tracking-[-0.03em] sm:text-[44px] sm:leading-[1.05]"
      >
        Built for long conversations
      </h2>
      <ul className="mt-8 grid gap-4 sm:grid-cols-3">
        {whySippa.map((item) => {
          const Icon = icons[item.icon];
          return (
            <li key={item.title} className="border-border bg-surface rounded-xl border p-5">
              <Icon className="text-primary-ink h-6 w-6" aria-hidden="true" />
              <h3 className="font-display mt-3 text-xl leading-snug font-extrabold">{item.title}</h3>
              <p className="mt-1 font-semibold">{item.body}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
