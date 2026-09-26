import { BrandIcon } from "@/components/BrandIcon";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { buttonClass } from "@/components/ui/button";
import { formatPrice, STRIPE_ITEMS, type StripeItem } from "@/config/site";
import { requireAdult } from "@/lib/auth";
import { describeItem } from "@/lib/billing/demo";
import { paymentsMode } from "@/lib/billing/mode";
import { confirmDemoPurchase } from "../actions";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

/** Simulated checkout (payments mode "demo"). No card, no money. */
export default async function DemoCheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ item?: string }>;
}) {
  await requireAdult("/app/plus");
  if (paymentsMode() !== "demo") redirect("/app/plus");
  const { item } = await searchParams;
  if (!item || !(item in STRIPE_ITEMS)) notFound();
  const info = describeItem(item as StripeItem);
  const isPlus = info.recurring !== null;

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <p role="note" className="bg-primary rounded-lg px-3 py-2 text-center text-xs font-bold text-black">
        DEMO CHECKOUT — no real payment is taken
      </p>
      <div className="border-border bg-surface mt-6 rounded-2xl border p-6">
        <p className="text-muted text-xs font-bold tracking-[0.08em] uppercase">Order summary</p>
        <div className="mt-3 flex items-center gap-3">
          <BrandIcon name={isPlus ? "plus" : "flowers"} size={44} />
          <div className="flex-1">
            <p className="font-extrabold">{info.title}</p>
            <p className="text-muted text-xs">
              {isPlus ? `Renews every ${info.recurring} (demo: doesn't renew)` : "One-time purchase"}
            </p>
          </div>
          <p className="text-lg font-extrabold">{formatPrice(info.price)}</p>
        </div>
        <form action={confirmDemoPurchase} className="mt-6">
          <input type="hidden" name="item" value={item} />
          <input type="hidden" name="nonce" value={crypto.randomUUID()} />
          <button type="submit" className={buttonClass({ size: "lg", className: "w-full" })}>
            Confirm demo purchase
          </button>
        </form>
        <Link
          href="/app/plus?canceled=1"
          className="text-muted hover:text-text mt-3 block text-center text-sm"
        >
          Cancel
        </Link>
      </div>
    </div>
  );
}
