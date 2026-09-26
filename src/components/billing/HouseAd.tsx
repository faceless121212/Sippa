import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { formatPrice, pricing } from "@/config/site";
import { BrandIcon } from "../BrandIcon";

/**
 * Free-plan promo slot (DECISIONS #14: light ads, never inside chats). Until an
 * ad network is chosen it promotes Sippa's own Plus plan — no third-party tracking.
 */
export function HouseAd() {
  return (
    <aside
      aria-label="Sippa Plus"
      className="bg-primary relative overflow-hidden rounded-2xl p-6 text-black sm:p-7"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgb(0_0_0/0.09)_1.5px,transparent_1.5px)] bg-[size:18px_18px]"
      />
      <div className="relative flex items-center gap-6">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-extrabold tracking-[0.1em] text-black/60 uppercase">Sippa Plus</p>
          <p className="mt-1 text-2xl leading-tight font-extrabold tracking-[-0.03em] sm:text-3xl">
            Sip without limits.
          </p>
          <p className="mt-1.5 text-sm font-medium text-black/70">
            Unlimited chats · {pricing.plusMonthlyBeans} Beans every month · zero ads
          </p>
          <Link
            href="/app/plus"
            className="group mt-4 inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-bold text-white transition-transform hover:-translate-y-0.5"
          >
            Try Plus — {formatPrice(pricing.plusMonthly)}/mo
            <ArrowRight
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        </div>
        <div className="relative hidden h-32 w-40 shrink-0 sm:block" aria-hidden="true">
          <BrandIcon name="plus" size={112} className="absolute top-0 right-6 rotate-[-6deg] shadow-2xl" />
          <BrandIcon
            name="beans"
            size={64}
            className="absolute right-0 bottom-0 rotate-[8deg] shadow-xl ring-4 ring-[var(--primary)]"
          />
        </div>
      </div>
    </aside>
  );
}
