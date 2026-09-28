import { NextResponse } from "next/server";
import { z } from "zod";
import { STRIPE_ITEMS } from "@/config/site";
import { paymentsMode } from "@/lib/billing/mode";
import { ensureCustomer, priceFor, stripe } from "@/lib/billing/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const body = z.object({ item: z.enum(Object.keys(STRIPE_ITEMS) as [keyof typeof STRIPE_ITEMS]) });

/**
 * Starts a purchase of Plus or a Bean pack and returns where to go next:
 * Stripe Checkout, or the simulated checkout in demo mode.
 */
export async function POST(request: Request) {
  const mode = paymentsMode();
  if (mode === "off") return NextResponse.json({ error: "Payments aren't set up yet." }, { status: 503 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });
  const { data: profile } = await createAdminClient()
    .from("profiles")
    .select("is_adult,banned_at,plan")
    .eq("id", user.id)
    .single();
  if (!profile?.is_adult || profile.banned_at) {
    return NextResponse.json({ error: "Not available for this account." }, { status: 403 });
  }

  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid item." }, { status: 400 });
  const item = parsed.data.item;
  const itemMode = STRIPE_ITEMS[item].mode;
  if (itemMode === "subscription" && profile.plan === "plus") {
    return NextResponse.json({ error: "You already have Sippa Plus." }, { status: 409 });
  }

  if (mode === "demo") return NextResponse.json({ url: `/app/plus/checkout?item=${item}` });

  const origin = process.env.NEXT_PUBLIC_SITE_URL?.trim() || new URL(request.url).origin;
  const [customer, price] = await Promise.all([ensureCustomer(user.id, user.email), priceFor(item)]);
  const session = await stripe().checkout.sessions.create({
    mode: itemMode,
    customer,
    client_reference_id: user.id,
    metadata: { user_id: user.id, item },
    line_items: [{ price: price.id, quantity: 1 }],
    ...(itemMode === "subscription" ? { subscription_data: { metadata: { user_id: user.id } } } : {}),
    allow_promotion_codes: true,
    success_url: `${origin}/app/plus/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/app/plus?canceled=1`,
  });
  return NextResponse.json({ url: session.url });
}
