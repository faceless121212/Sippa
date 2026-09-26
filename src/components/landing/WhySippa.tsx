import { Ban, Brain, Lock, MonitorSmartphone, Theater } from "lucide-react";
import { whySippa } from "@/data/landing";

const icons = {
  brain: Brain,
  ban: Ban,
  devices: MonitorSmartphone,
  theater: Theater,
  lock: Lock,
} as const;

export function WhySippa() {
  return (
    <section id="why" aria-labelledby="why-title" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24">
      <p className="text-muted mb-3 inline-flex items-center gap-1.5 text-xs font-semibold tracking-[0.08em] uppercase">
        <span className="bg-primary h-1.5 w-1.5 rounded-full ring-1 ring-black/20" aria-hidden="true" />
        Why Sippa
      </p>
      <h2
        id="why-title"
        className="font-display text-3xl font-extrabold tracking-[-0.03em] sm:text-[44px] sm:leading-[1.05]"
      >
        Why sip with Sippa
      </h2>
      <p className="text-muted mt-3 max-w-2xl">Everything other AI chat apps get wrong, fixed.</p>
      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {whySippa.map((item) => {
          const Icon = icons[item.icon];
          return (
            <li key={item.title} className="border-border bg-surface rounded-xl border p-5">
              <Icon className="text-primary-ink h-6 w-6" aria-hidden="true" />
              <h3 className="font-display mt-3 text-lg leading-snug font-bold">{item.title}</h3>
              <p className="text-muted mt-2 text-sm">{item.body}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
