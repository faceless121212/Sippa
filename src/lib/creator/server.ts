import "server-only";
import { NextResponse } from "next/server";
import { siteConfig } from "@/config/site";
import { createRateLimiter } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type Creator = {
  userId: string;
  plan: "free" | "plus";
  creationsUsed: number;
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
    .select("is_adult,banned_at,plan,free_creations_used")
    .eq("id", user.id)
    .maybeSingle();
  if (!p?.is_adult || p.banned_at)
    throw new CreatorError("Your account can't create characters right now.", 403);
  return { userId: user.id, plan: p.plan, creationsUsed: p.free_creations_used, admin };
}

/** Free creations left (null = unlimited on Plus). */
export function creationsLeft(c: Creator): number | null {
  return c.plan === "plus" ? null : Math.max(0, siteConfig.freeCharacterCreations - c.creationsUsed);
}

export function assertCanCreate(c: Creator) {
  if (creationsLeft(c) === 0) {
    throw new CreatorError(
      `You've used your ${siteConfig.freeCharacterCreations} free creations. More with Beans or Sippa Plus — coming very soon.`,
      402,
      { paywall: true },
    );
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
