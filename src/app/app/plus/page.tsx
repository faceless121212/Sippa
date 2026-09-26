import { Check } from "lucide-react";
import { BrandIcon } from "@/components/BrandIcon";
import type { Metadata } from "next";
import { BuyButton } from "@/components/billing/BuyButton";
import { beanCosts, beanPacks, formatPrice, pricing, siteConfig, yearlySavingsPercent } from "@/config/site";
import { requireAdult } from "@/lib/auth";
import { paymentsMode } from "@/lib/billing/mode";
import { syncSubscription } from "@/lib/billing/stripe";
import { cancelDemoPlus } from "./actions";
import { createAdminClient } from "@/lib/supabase/admin";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Sippa Plus" };

const PLUS_FEATURES = [
  "Unlimited messages",
  "Unlimited character creations",
  `${pricing.plusMonthlyBeans} Flowers every month`,
  "Longer memory",
  "No ads",
];

export default async function PlusPage({ searchParams }: { searchParams: Promise<{ canceled?: string }> }) {
  const viewer = await requireAdult("/app/plus");
  const { canceled } = await searchParams;
  await syncSubscription(viewer.user.id).catch(() => {});
  const { data: p } = await createAdminClient()
    .from("profiles")
    .select("plan,beans,plus_until,subscription_status,stripe_customer_id")
    .eq("id", viewer.user.id)
    .single();
  const isPlus = p?.plan === "plus";
  const mode = paymentsMode();
  const savings = yearlySavingsPercent(pricing.plusMonthly, pricing.plusYearly);

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-6 sm:px-6 md:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-muted text-xs font-bold tracking-[0.08em] uppercase">Plans & Flowers</p>
          <h1 className="text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">
            {isPlus ? "You're on Sippa Plus ☕" : "Sip without limits"}
          </h1>
        </div>
        <div className="border-border bg-surface flex items-center gap-2 rounded-xl border px-4 py-2.5">
          <BrandIcon name="flowers" size={28} />
          <span className="text-sm">
            <strong className="text-lg">{p?.beans ?? 0}</strong> Beans
          </span>
        </div>
      </div>

      {canceled && (
        <p role="status" className="border-border bg-surface rounded-xl border p-3 text-sm">
          Checkout canceled — nothing was charged.
        </p>
      )}
      {mode === "demo" && (
        <p role="note" className="bg-primary rounded-xl px-3 py-2 text-sm font-semibold text-black">
          Demo payments: purchases are simulated — no card, no real money.
        </p>
      )}
      {mode === "off" && (
        <p role="status" className="border-border bg-surface rounded-xl border p-3 text-sm">
          Payments aren&apos;t available yet.
        </p>
      )}

      {/* Plus */}
      <section aria-labelledby="plus" className="grid gap-4 md:grid-cols-2">
        <div className="border-text rounded-2xl border-2 p-6">
          <h2 id="plus" className="flex items-center gap-2 text-2xl font-extrabold">
            <BrandIcon name="plus" size={40} /> Sippa Plus
          </h2>
          <ul className="mt-4 space-y-2.5">
            {PLUS_FEATURES.map((f) => (
              <li key={f} className="flex gap-2 text-sm">
                <Check className="text-primary-ink mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                {f}
              </li>
            ))}
          </ul>
          {isPlus ? (
            <div className="mt-6 space-y-2">
              <p className="text-muted text-sm">
                {(p?.subscription_status === "active" || p?.subscription_status === "demo") && p.plus_until
                  ? `${p.subscription_status === "demo" ? "Demo Plus until" : "Renews"} ${new Date(p.plus_until).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}.`
                  : `Status: ${p?.subscription_status ?? "active"}.`}
              </p>
              {p?.subscription_status === "demo" ? (
                <form action={cancelDemoPlus}>
                  <button
                    type="submit"
                    className={buttonClass({ variant: "secondary", className: "w-full" })}
                  >
                    Cancel Plus (demo)
                  </button>
                </form>
              ) : (
                <BuyButton portal variant="secondary">
                  Manage subscription
                </BuyButton>
              )}
            </div>
          ) : (
            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              <div>
                <p className="text-2xl font-extrabold">
                  {formatPrice(pricing.plusMonthly)}
                  <span className="text-muted text-sm font-medium"> / month</span>
                </p>
                <BuyButton item="plus_monthly" className="mt-2">
                  Go monthly
                </BuyButton>
              </div>
              <div>
                <p className="text-2xl font-extrabold">
                  {formatPrice(pricing.plusYearly)}
                  <span className="text-muted text-sm font-medium"> / year</span>
                </p>
                <BuyButton item="plus_yearly" variant="secondary" className="mt-2">
                  Go yearly · save {savings}%
                </BuyButton>
              </div>
            </div>
          )}
        </div>

        <div className="border-border bg-surface rounded-2xl border p-6">
          <h2 className="text-2xl font-extrabold">Free</h2>
          <ul className="text-muted mt-4 space-y-2.5 text-sm">
            <li>{pricing.freeMessagesPerDay} messages a day</li>
            <li>{siteConfig.freeCharacterCreations} free character creations</li>
            <li>Light ads — never inside chats</li>
          </ul>
          <h3 className="mt-6 text-sm font-extrabold">What Flowers buy</h3>
          <ul className="text-muted mt-2 space-y-1.5 text-sm">
            <li>
              <strong className="text-text">{beanCosts.creation} Flowers</strong> — one more character
              creation
            </li>
            <li>
              <strong className="text-text">{beanCosts.message} Flower</strong> — one message past the daily
              limit (only when you choose)
            </li>
          </ul>
        </div>
      </section>

      {/* Beans */}
      <section aria-labelledby="beans">
        <h2 id="beans" className="text-xl font-extrabold tracking-[-0.02em]">
          Flower packs
        </h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-3">
          {beanPacks.map((pack) => (
            <li
              key={pack.id}
              className={cn(
                "border-border bg-bg relative rounded-2xl border p-5",
                pack.label && "border-text",
              )}
            >
              {pack.label && (
                <span className="bg-primary absolute -top-2.5 right-4 rounded-md px-2 py-0.5 text-[11px] font-bold text-black">
                  {pack.label}
                </span>
              )}
              <p className="flex items-center gap-2 text-2xl font-extrabold">
                <BrandIcon name="flowers" size={36} /> {pack.beans}
              </p>
              <p className="text-muted text-sm">Flowers · {formatPrice(pack.price)}</p>
              <BuyButton item={pack.id} variant={pack.label ? "primary" : "secondary"} className="mt-4">
                Buy for {formatPrice(pack.price)}
              </BuyButton>
            </li>
          ))}
        </ul>
        <p className="text-muted mt-4 text-xs">
          {mode === "stripe" ? "Test mode — card 4242 4242 4242 4242, any future date, any CVC. " : ""}Prices
          include VAT. Cancel anytime.
        </p>
      </section>
    </div>
  );
}
