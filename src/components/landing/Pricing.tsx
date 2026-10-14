"use client";

import { Check } from "lucide-react";
import { useState } from "react";
import { formatPrice, planFeatures, pricing, yearlySavingsPercent } from "@/config/site";
import { cn } from "@/lib/utils";
import { signupHref } from "@/lib/signup";
import { buttonClass } from "../ui/button";

type Billing = "monthly" | "yearly";

export function Pricing() {
  const [billing, setBilling] = useState<Billing>("monthly");
  const yearly = billing === "yearly";
  const savings = Math.max(
    yearlySavingsPercent(pricing.plusMonthly, pricing.plusYearly),
    yearlySavingsPercent(pricing.ultraMonthly, pricing.ultraYearly),
  );
  const paid = (monthly: number, perYear: number) => ({
    price: formatPrice(yearly ? perYear : monthly),
    period: yearly ? "per year" : "per month",
    note: yearly ? `${formatPrice(perYear / 12)} / month, billed yearly` : undefined,
  });

  return (
    <section id="pricing" aria-labelledby="pricing-title" className="border-border bg-surface/50 border-y">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24">
        <div className="text-center">
          <p className="text-muted mb-3 inline-flex items-center gap-1.5 text-xs font-semibold tracking-[0.08em] uppercase">
            <span className="bg-primary h-1.5 w-1.5 rounded-full ring-1 ring-black/20" aria-hidden="true" />
            Pricing
          </p>
          <h2
            id="pricing-title"
            className="font-display text-3xl font-extrabold tracking-[-0.03em] sm:text-[44px] sm:leading-[1.05]"
          >
            Free to start
          </h2>
          <p className="text-muted mt-3">Go Plus for unlimited chats, or Ultra for the deepest memory.</p>

          <fieldset className="border-border bg-surface mt-6 inline-flex rounded-lg border p-1">
            <legend className="sr-only">Billing period</legend>
            {(["monthly", "yearly"] as const).map((b) => (
              <label
                key={b}
                className={cn(
                  "has-[:focus-visible]:outline-text cursor-pointer rounded-md px-4 py-2 text-sm font-medium transition-colors has-[:focus-visible]:outline-2",
                  billing === b ? "bg-primary text-on-primary" : "text-muted hover:text-text",
                )}
              >
                <input
                  type="radio"
                  name="billing"
                  value={b}
                  checked={billing === b}
                  onChange={() => setBilling(b)}
                  className="sr-only"
                />
                {b === "monthly" ? "Monthly" : `Yearly · save up to ${savings}%`}
              </label>
            ))}
          </fieldset>
        </div>

        <div className="mx-auto mt-10 grid max-w-5xl gap-4 md:grid-cols-3">
          <PlanCard
            name="Free"
            price="$0"
            period="forever"
            features={planFeatures.free}
            cta="Create free account"
          />
          <PlanCard
            name="Sippa Plus"
            {...paid(pricing.plusMonthly, pricing.plusYearly)}
            features={planFeatures.plus}
            cta="Get Plus"
            highlight
            badge="Most popular"
          />
          <PlanCard
            name="Sippa Ultra"
            {...paid(pricing.ultraMonthly, pricing.ultraYearly)}
            features={planFeatures.ultra}
            cta="Get Ultra"
            upgrade
          />
        </div>
        <p className="text-muted mt-6 text-center text-xs">Taxes included. Cancel anytime.</p>
      </div>
    </section>
  );
}

function PlanCard({
  name,
  price,
  period,
  note,
  features,
  cta,
  highlight,
  upgrade,
  badge,
}: {
  name: string;
  price: string;
  period: string;
  note?: string;
  features: string[];
  cta: string;
  highlight?: boolean;
  upgrade?: boolean;
  badge?: string;
}) {
  return (
    <article
      className={cn(
        "bg-surface relative flex flex-col rounded-xl border p-6 sm:p-8",
        highlight ? "border-text border-2" : "border-border",
      )}
    >
      {badge && (
        <span className="bg-primary text-on-primary absolute -top-2.5 right-5 rounded-md px-2 py-0.5 text-[11px] font-bold">
          {badge}
        </span>
      )}
      <h3 className="font-display text-2xl font-bold">{name}</h3>
      <p className="mt-4">
        <span className="font-display text-4xl font-bold">{price}</span>{" "}
        <span className="text-muted text-sm">{period}</span>
      </p>
      <p className="text-muted mt-1 min-h-5 text-xs">{note}</p>
      <ul className="mt-6 flex flex-1 flex-col gap-3">
        {features.map((f) => (
          <li key={f} className="flex gap-2 text-sm">
            <Check className="text-primary-ink mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {f}
          </li>
        ))}
      </ul>
      <a
        href={highlight || upgrade ? signupHref("/app/plus") : signupHref()}
        className={buttonClass({ variant: highlight ? "primary" : "secondary", className: "mt-8" })}
      >
        {cta}
      </a>
    </article>
  );
}
