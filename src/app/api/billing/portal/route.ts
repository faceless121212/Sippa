import { NextResponse } from "next/server";
import { stripe, stripeConfigured } from "@/lib/billing/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/** Opens the Stripe Customer Portal (manage / cancel Plus, invoices). */
export async function POST(request: Request) {
  if (!stripeConfigured())
    return NextResponse.json({ error: "Payments aren't set up yet." }, { status: 503 });
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });
  const { data: p } = await createAdminClient()
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();
  if (!p?.stripe_customer_id) return NextResponse.json({ error: "No billing account yet." }, { status: 404 });

  const configs = await stripe().billingPortal.configurations.list({ limit: 100 });
  const configuration = configs.data.find((c) => c.metadata?.app === "sippa")?.id;
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;
  const session = await stripe().billingPortal.sessions.create({
    customer: p.stripe_customer_id,
    return_url: `${origin}/app/plus`,
    ...(configuration ? { configuration } : {}),
  });
  return NextResponse.json({ url: session.url });
}
