/**
 * How purchases are processed.
 * - "stripe": real Stripe Checkout (test mode keys).
 * - "demo":   simulated checkout that grants Plus/Beans without payment.
 *             Default in development when no Stripe key is set; in production
 *             only with PAYMENTS_MODE=demo (e.g. a private preview deploy).
 * - "off":    purchases disabled.
 */
export type PaymentsMode = "stripe" | "demo" | "off";

export function paymentsMode(env: Record<string, string | undefined> = process.env): PaymentsMode {
  if (env.STRIPE_SECRET_KEY) return "stripe";
  if (env.PAYMENTS_MODE === "demo") return "demo";
  if (env.NODE_ENV !== "production" && env.PAYMENTS_MODE !== "off") return "demo";
  return "off";
}
