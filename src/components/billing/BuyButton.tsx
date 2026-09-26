"use client";

import { useState } from "react";
import type { StripeItem } from "@/config/site";
import { buttonClass } from "../ui/button";

/** Starts Stripe Checkout (or the Customer Portal) and redirects there. */
export function BuyButton({
  item,
  portal,
  children,
  variant = "primary",
  className,
}: {
  item?: StripeItem;
  portal?: boolean;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const go = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(portal ? "/api/billing/portal" : "/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: portal ? undefined : JSON.stringify({ item }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) throw new Error(data.error ?? "Couldn't open checkout.");
      window.location.href = data.url;
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  return (
    <div className={className}>
      <button
        type="button"
        onClick={go}
        disabled={busy}
        className={buttonClass({ variant, className: "w-full" })}
      >
        {busy ? "Opening…" : children}
      </button>
      {error && (
        <p role="alert" className="text-lover-ink mt-1.5 text-xs font-medium">
          {error}
        </p>
      )}
    </div>
  );
}
