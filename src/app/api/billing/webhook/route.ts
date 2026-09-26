import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { applySubscription, fulfilCheckout, grantPlusBonus, stripe } from "@/lib/billing/stripe";

/**
 * Stripe webhook (production path; locally the success page re-checks the
 * session instead). Signature-verified; every handler is idempotent.
 */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook secret not set." }, { status: 503 });
  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature." }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(await request.text(), signature, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
      await fulfilCheckout(event.data.object.id);
      break;
    case "invoice.paid":
      await grantPlusBonus(event.data.object);
      break;
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await applySubscription(event.data.object);
      break;
  }
  return NextResponse.json({ received: true });
}
