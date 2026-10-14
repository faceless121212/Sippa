/**
 * Creates Sippa's Stripe products, prices and customer-portal config
 * (TEST MODE). Safe to re-run: existing lookup keys are left alone.
 *   npm run stripe:setup
 */
import Stripe from "stripe";
import { beanPacks, pricing, STRIPE_ITEMS } from "../src/config/site";

const key = process.env.STRIPE_SECRET_KEY;
if (!key?.startsWith("sk_test_")) {
  console.error("STRIPE_SECRET_KEY must be a TEST key (sk_test_...).");
  process.exit(1);
}
const stripe = new Stripe(key);
const cents = (n: number) => Math.round(n * 100);

/**
 * Makes sure a price with this lookup key exists at this amount/currency. If an older
 * price holds the key (e.g. the earlier EUR prices), a new one takes the key over.
 */
async function ensurePrice(
  lookupKey: string,
  spec: { amount: number; recurring?: "month" | "year" },
  product: () => Promise<string>,
) {
  const currency = pricing.currency.toLowerCase();
  const { data } = await stripe.prices.list({ lookup_keys: [lookupKey], limit: 1 });
  const current = data[0];
  if (current && current.unit_amount === cents(spec.amount) && current.currency === currency)
    return console.log(`= ${lookupKey} exists (${current.id})`);
  const price = await stripe.prices.create({
    product: current ? (current.product as string) : await product(),
    currency,
    unit_amount: cents(spec.amount),
    ...(spec.recurring ? { recurring: { interval: spec.recurring } } : {}),
    lookup_key: lookupKey,
    transfer_lookup_key: true,
    tax_behavior: "inclusive",
  });
  console.log(`${current ? "~" : "+"} ${lookupKey} → ${price.id} (${spec.amount} ${currency})`);
}

async function plan(name: string, description: string, monthly: [string, number], yearly: [string, number]) {
  let productId: string | null = null;
  const product = async () => (productId ??= (await stripe.products.create({ name, description })).id);
  await ensurePrice(monthly[0], { amount: monthly[1], recurring: "month" }, product);
  await ensurePrice(yearly[0], { amount: yearly[1], recurring: "year" }, product);
}

async function main() {
  await plan(
    "Sippa Plus",
    `Unlimited messages & creations, no ads, ${pricing.plusMonthlyBeans} Flowers every month.`,
    [STRIPE_ITEMS.plus_monthly.lookupKey, pricing.plusMonthly],
    [STRIPE_ITEMS.plus_yearly.lookupKey, pricing.plusYearly],
  );
  await plan(
    "Sippa Ultra",
    `Everything in Plus, longer memory, ${pricing.ultraMonthlyBeans} Flowers every month, voice replies (coming soon).`,
    [STRIPE_ITEMS.ultra_monthly.lookupKey, pricing.ultraMonthly],
    [STRIPE_ITEMS.ultra_yearly.lookupKey, pricing.ultraYearly],
  );

  for (const pack of beanPacks) {
    const lookup = STRIPE_ITEMS[pack.id].lookupKey;
    await ensurePrice(lookup, { amount: pack.price }, async () => {
      const product = await stripe.products.create({
        name: `${pack.beans} Flowers`,
        description: "Sippa Flowers for gifts, extra creations and messages.",
      });
      return product.id;
    });
  }

  const configs = await stripe.billingPortal.configurations.list({ limit: 100 });
  if (!configs.data.some((c) => c.metadata?.app === "sippa")) {
    const prices = await stripe.prices.list({
      lookup_keys: [
        STRIPE_ITEMS.plus_monthly.lookupKey,
        STRIPE_ITEMS.plus_yearly.lookupKey,
        STRIPE_ITEMS.ultra_monthly.lookupKey,
        STRIPE_ITEMS.ultra_yearly.lookupKey,
      ],
    });
    // One entry per product, so people can switch between Plus and Ultra in the portal.
    const byProduct = new Map<string, string[]>();
    for (const pr of prices.data)
      byProduct.set(pr.product as string, [...(byProduct.get(pr.product as string) ?? []), pr.id]);
    await stripe.billingPortal.configurations.create({
      metadata: { app: "sippa" },
      business_profile: { headline: "Manage your Sippa subscription" },
      features: {
        invoice_history: { enabled: true },
        payment_method_update: { enabled: true },
        subscription_cancel: { enabled: true, mode: "at_period_end" },
        subscription_update: {
          enabled: true,
          default_allowed_updates: ["price"],
          products: [...byProduct].map(([product, ids]) => ({ product, prices: ids })),
        },
      },
    });
    console.log("+ customer portal configured");
  } else console.log("= customer portal exists");
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
