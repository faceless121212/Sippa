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

async function ensurePrice(lookupKey: string, create: () => Promise<Stripe.Price>) {
  const { data } = await stripe.prices.list({ lookup_keys: [lookupKey], limit: 1 });
  if (data[0]) return console.log(`= ${lookupKey} exists (${data[0].id})`);
  const price = await create();
  console.log(`+ ${lookupKey} created (${price.id})`);
}

async function main() {
  const plus = await stripe.products.create({ name: "Sippa Plus", description: "Unlimited messages & creations, no ads, 300 Flowers every month." });
  await ensurePrice(STRIPE_ITEMS.plus_monthly.lookupKey, () =>
    stripe.prices.create({ product: plus.id, currency: "eur", unit_amount: cents(pricing.plusMonthly), recurring: { interval: "month" }, lookup_key: STRIPE_ITEMS.plus_monthly.lookupKey, tax_behavior: "inclusive" }),
  );
  await ensurePrice(STRIPE_ITEMS.plus_yearly.lookupKey, () =>
    stripe.prices.create({ product: plus.id, currency: "eur", unit_amount: cents(pricing.plusYearly), recurring: { interval: "year" }, lookup_key: STRIPE_ITEMS.plus_yearly.lookupKey, tax_behavior: "inclusive" }),
  );
  // If both prices already existed, the fresh product above is unused — archive it.
  const used = await stripe.prices.list({ product: plus.id, limit: 1 });
  if (!used.data.length) await stripe.products.update(plus.id, { active: false });

  for (const pack of beanPacks) {
    const lookup = STRIPE_ITEMS[pack.id].lookupKey;
    await ensurePrice(lookup, async () => {
      const product = await stripe.products.create({ name: `${pack.beans} Flowers`, description: "Sippa Flowers for extra creations and messages." });
      return stripe.prices.create({ product: product.id, currency: "eur", unit_amount: cents(pack.price), lookup_key: lookup, tax_behavior: "inclusive" });
    });
  }

  const configs = await stripe.billingPortal.configurations.list({ limit: 100 });
  if (!configs.data.some((c) => c.metadata?.app === "sippa")) {
    const prices = await stripe.prices.list({ lookup_keys: [STRIPE_ITEMS.plus_monthly.lookupKey, STRIPE_ITEMS.plus_yearly.lookupKey] });
    await stripe.billingPortal.configurations.create({
      metadata: { app: "sippa" },
      business_profile: { headline: "Manage your Sippa Plus subscription" },
      features: {
        invoice_history: { enabled: true },
        payment_method_update: { enabled: true },
        subscription_cancel: { enabled: true, mode: "at_period_end" },
        subscription_update: {
          enabled: true,
          default_allowed_updates: ["price"],
          products: [{ product: prices.data[0].product as string, prices: prices.data.map((p) => p.id) }],
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
