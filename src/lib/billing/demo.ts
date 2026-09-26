import "server-only";
import { beanPacks, pricing, STRIPE_ITEMS, type StripeItem } from "@/config/site";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Simulated purchases (payments mode "demo"). Same effects as a real Stripe
 * purchase, recorded in the same ledger, keyed by a one-time nonce so a
 * double-submit can't grant twice.
 */
export type DemoResult = { kind: "beans"; beans: number } | { kind: "plus" } | { kind: "duplicate" };

export function describeItem(item: StripeItem) {
  const pack = beanPacks.find((p) => p.id === item);
  if (pack)
    return { title: `${pack.beans} Beans`, price: pack.price, recurring: null as null | "month" | "year" };
  const yearly = item === "plus_yearly";
  return {
    title: `Sippa Plus — ${yearly ? "yearly" : "monthly"}`,
    price: yearly ? pricing.plusYearly : pricing.plusMonthly,
    recurring: (yearly ? "year" : "month") as "month" | "year",
  };
}

export async function demoFulfil(userId: string, item: StripeItem, nonce: string): Promise<DemoResult> {
  const admin = createAdminClient();
  const ref = `demo_${nonce}`;
  const info = describeItem(item);

  if (STRIPE_ITEMS[item].mode === "payment") {
    const pack = beanPacks.find((p) => p.id === item)!;
    const { data: ok } = await admin.rpc("grant_beans", {
      p_user: userId,
      p_beans: pack.beans,
      p_type: "beans_pack",
      p_stripe_id: ref,
      p_amount_cents: Math.round(pack.price * 100),
      p_currency: "eur",
    });
    return ok ? { kind: "beans", beans: pack.beans } : { kind: "duplicate" };
  }

  const yearly = info.recurring === "year";
  const { data: ok } = await admin.rpc("grant_beans", {
    p_user: userId,
    p_beans: pricing.plusMonthlyBeans * (yearly ? 12 : 1),
    p_type: "plus_bonus",
    p_stripe_id: ref,
    p_amount_cents: null,
    p_currency: null,
  });
  if (!ok) return { kind: "duplicate" };
  const until = new Date();
  if (yearly) until.setFullYear(until.getFullYear() + 1);
  else until.setMonth(until.getMonth() + 1);
  await admin
    .from("profiles")
    .update({
      plan: "plus",
      subscription_status: "demo",
      subscription_id: null,
      plus_until: until.toISOString(),
    })
    .eq("id", userId);
  return { kind: "plus" };
}

export async function demoCancel(userId: string) {
  await createAdminClient()
    .from("profiles")
    .update({ plan: "free", subscription_status: "canceled", plus_until: null })
    .eq("id", userId)
    .eq("subscription_status", "demo");
}

/** Demo Plus doesn't renew: drop back to Free once the period ends. */
export async function expireDemoPlus(userId: string) {
  await createAdminClient()
    .from("profiles")
    .update({ plan: "free", subscription_status: "expired" })
    .eq("id", userId)
    .eq("subscription_status", "demo")
    .lt("plus_until", new Date().toISOString());
}
