import "server-only";
import Stripe from "stripe";
import { beanPacks, pricing, STRIPE_ITEMS, type StripeItem } from "@/config/site";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Stripe billing (test mode). Plan and Beans change ONLY here, after Stripe
 * confirms payment — via the webhook or by re-checking the Checkout Session
 * when the user returns. Both paths are idempotent (ledger keyed by Stripe id).
 */

let client: Stripe | null = null;
export const stripeConfigured = () => Boolean(process.env.STRIPE_SECRET_KEY);

export function stripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set.");
  if (
    process.env.NODE_ENV === "production" &&
    key.startsWith("sk_live_") &&
    process.env.ALLOW_LIVE_PAYMENTS !== "1"
  ) {
    throw new Error("Live Stripe keys are disabled until ALLOW_LIVE_PAYMENTS=1.");
  }
  client ??= new Stripe(key);
  return client;
}

const PACK_BEANS: Record<string, number> = Object.fromEntries(
  beanPacks.map((p) => [STRIPE_ITEMS[p.id].lookupKey, p.beans]),
);

export async function priceFor(item: StripeItem): Promise<Stripe.Price> {
  const { data } = await stripe().prices.list({
    lookup_keys: [STRIPE_ITEMS[item].lookupKey],
    active: true,
    limit: 1,
  });
  if (!data[0])
    throw new Error(`Stripe price ${STRIPE_ITEMS[item].lookupKey} missing — run npm run stripe:setup.`);
  return data[0];
}

/** Returns the user's Stripe customer id, creating the customer on first purchase. */
export async function ensureCustomer(userId: string, email: string | null | undefined): Promise<string> {
  const admin = createAdminClient();
  const { data: p } = await admin.from("profiles").select("stripe_customer_id").eq("id", userId).single();
  if (p?.stripe_customer_id) return p.stripe_customer_id;
  const customer = await stripe().customers.create({
    email: email ?? undefined,
    metadata: { user_id: userId },
  });
  await admin.from("profiles").update({ stripe_customer_id: customer.id }).eq("id", userId);
  return customer.id;
}

async function userIdForCustomer(customerId: string): Promise<string | null> {
  const { data } = await createAdminClient()
    .from("profiles")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  return data?.id ?? null;
}

/** Mirrors a subscription's state onto the profile. */
export async function applySubscription(sub: Stripe.Subscription) {
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const userId = sub.metadata.user_id || (await userIdForCustomer(customerId));
  if (!userId) return;
  const active = sub.status === "active" || sub.status === "trialing";
  const periodEnd = Math.max(...sub.items.data.map((i) => i.current_period_end));
  await createAdminClient()
    .from("profiles")
    .update({
      plan: active ? "plus" : "free",
      subscription_id: sub.id,
      subscription_status: sub.status,
      plus_until: Number.isFinite(periodEnd) ? new Date(periodEnd * 1000).toISOString() : null,
    })
    .eq("id", userId);
}

/** Plus includes monthly Beans: 300 per month, or 12 × 300 on a yearly invoice. */
export async function grantPlusBonus(invoice: Stripe.Invoice) {
  if (invoice.status !== "paid" || !invoice.id) return;
  const subId = invoice.parent?.subscription_details?.subscription;
  if (!subId) return;
  const sub = await stripe().subscriptions.retrieve(typeof subId === "string" ? subId : subId.id);
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const userId = sub.metadata.user_id || (await userIdForCustomer(customerId));
  if (!userId) return;
  const yearly = sub.items.data.some((i) => i.price.recurring?.interval === "year");
  const beans = pricing.plusMonthlyBeans * (yearly ? 12 : 1);
  await createAdminClient().rpc("grant_beans", {
    p_user: userId,
    p_beans: beans,
    p_type: "plus_bonus",
    p_stripe_id: invoice.id,
    p_amount_cents: null,
    p_currency: null,
  });
}

/**
 * Fulfils a completed Checkout Session (from the webhook or the success page).
 * Returns what happened, for the success screen.
 */
export async function fulfilCheckout(sessionId: string, expectUserId?: string) {
  const session = await stripe().checkout.sessions.retrieve(sessionId, {
    expand: ["line_items.data.price", "subscription", "subscription.latest_invoice"],
  });
  const userId = session.client_reference_id ?? session.metadata?.user_id;
  if (!userId || (expectUserId && userId !== expectUserId)) return { kind: "mismatch" as const };

  if (session.mode === "payment") {
    if (session.payment_status !== "paid") return { kind: "pending" as const };
    const lookup = session.line_items?.data[0]?.price?.lookup_key ?? "";
    const beans = PACK_BEANS[lookup];
    if (!beans) return { kind: "unknown" as const };
    await createAdminClient().rpc("grant_beans", {
      p_user: userId,
      p_beans: beans,
      p_type: "beans_pack",
      p_stripe_id: session.id,
      p_amount_cents: session.amount_total,
      p_currency: session.currency,
    });
    return { kind: "beans" as const, beans };
  }

  if (session.mode === "subscription" && session.subscription && typeof session.subscription !== "string") {
    await applySubscription(session.subscription);
    const inv = session.subscription.latest_invoice;
    if (inv && typeof inv !== "string") await grantPlusBonus(inv);
    return { kind: "plus" as const, active: session.subscription.status === "active" };
  }
  return { kind: "pending" as const };
}

/** Re-reads the user's subscription from Stripe (covers missed webhooks locally). */
export async function syncSubscription(userId: string) {
  if (!stripeConfigured()) return;
  const { data: p } = await createAdminClient()
    .from("profiles")
    .select("subscription_id")
    .eq("id", userId)
    .maybeSingle();
  if (!p?.subscription_id) return;
  await applySubscription(await stripe().subscriptions.retrieve(p.subscription_id));
}
