import "server-only";
import { NextResponse } from "next/server";
import { beanCosts, siteConfig } from "@/config/site";
import { createRateLimiter } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type Creator = {
  userId: string;
  plan: "free" | "plus";
  creationsUsed: number;
  beans: number;
  admin: ReturnType<typeof createAdminClient>;
};

export class CreatorError extends Error {
  constructor(
    message: string,
    public status: number,
    public extra: Record<string, unknown> = {},
  ) {
    super(message);
  }
}

/** Signed-in, age-verified, not banned. */
export async function requireCreator(): Promise<Creator> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new CreatorError("Please log in.", 401);
  const admin = createAdminClient();
  const { data: p } = await admin
    .from("profiles")
    .select("is_adult,banned_at,plan,free_creations_used,beans")
    .eq("id", user.id)
    .maybeSingle();
  if (!p?.is_adult || p.banned_at)
    throw new CreatorError("Your account can't create characters right now.", 403);
  return { userId: user.id, plan: p.plan, creationsUsed: p.free_creations_used, beans: p.beans, admin };
}

/** Free creations left (null = unlimited on Plus). */
export function creationsLeft(c: Creator): number | null {
  return c.plan === "plus" ? null : Math.max(0, siteConfig.freeCharacterCreations - c.creationsUsed);
}

/** Free creation, Plus, or enough Beans to pay for one. */
export function assertCanCreate(c: Creator) {
  if (creationsLeft(c) === 0 && c.beans < beanCosts.creation) {
    throw new CreatorError(
      `You've used your ${siteConfig.freeCharacterCreations} free creations. Each new one costs ${beanCosts.creation} Flowers — or go unlimited with Sippa Plus.`,
      402,
      { paywall: true },
    );
  }
}

/** Charges for a creation at save time: free slot first, then Beans. */
export async function chargeCreation(c: Creator): Promise<"free" | "beans"> {
  const left = creationsLeft(c);
  if (left === null || left > 0) {
    await c.admin
      .from("profiles")
      .update({ free_creations_used: c.creationsUsed + 1 })
      .eq("id", c.userId);
    return "free";
  }
  const { data } = await c.admin.rpc("spend_beans", {
    p_user: c.userId,
    p_beans: beanCosts.creation,
    p_reason: "creation",
  });
  if (typeof data !== "number" || data < 0) {
    throw new CreatorError(`You need ${beanCosts.creation} Flowers for another creation.`, 402, {
      paywall: true,
    });
  }
  return "beans";
}

/** Gives the charge back if saving failed afterwards. */
export async function refundCreation(c: Creator, charged: "free" | "beans") {
  if (charged === "free") {
    await c.admin.from("profiles").update({ free_creations_used: c.creationsUsed }).eq("id", c.userId);
  } else {
    await c.admin.rpc("grant_beans", {
      p_user: c.userId,
      p_beans: beanCosts.creation,
      p_type: "refund",
      p_stripe_id: null,
      p_amount_cents: null,
      p_currency: null,
    });
  }
}

// Per-user abuse limits on the expensive calls (single instance; Redis later).
export const limits = {
  generate: createRateLimiter({ limit: 12, windowMs: 60 * 60_000 }),
  field: createRateLimiter({ limit: 40, windowMs: 60 * 60_000 }),
  avatars: createRateLimiter({ limit: 8, windowMs: 60 * 60_000 }),
};

export function rateLimit(check: (key: string) => boolean, key: string) {
  if (!check(key)) throw new CreatorError("You're going a bit fast — try again in a little while.", 429);
}

export function creatorError(e: unknown) {
  if (e instanceof CreatorError)
    return NextResponse.json({ error: e.message, ...e.extra }, { status: e.status });
  console.error("creator:", e);
  return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
}
