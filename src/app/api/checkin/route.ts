import { NextResponse } from "next/server";
import { checkinReward, nextStreak } from "@/config/engagement";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const day = (d: Date) => d.toISOString().slice(0, 10);

/** Daily check-in: 5 Flowers a day, +30 on every 7th day in a row. Once per UTC day. */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });
  const admin = createAdminClient();
  const { data: p } = await admin.from("profiles").select("is_adult,banned_at").eq("id", user.id).single();
  if (!p?.is_adult || p.banned_at) return NextResponse.json({ error: "Not available." }, { status: 403 });

  const today = day(new Date());
  const yesterday = day(new Date(Date.now() - 86_400_000));
  const { data: rows } = await admin
    .from("checkins")
    .select("day,streak")
    .eq("user_id", user.id)
    .in("day", [today, yesterday]);
  if (rows?.some((r) => r.day === today))
    return NextResponse.json({ error: "Already claimed today." }, { status: 409 });

  const streak = nextStreak(rows?.find((r) => r.day === yesterday)?.streak ?? null);
  const { error } = await admin.from("checkins").insert({ user_id: user.id, day: today, streak });
  if (error) return NextResponse.json({ error: "Already claimed today." }, { status: 409 });
  const reward = checkinReward(streak);
  await admin.rpc("grant_beans", {
    p_user: user.id,
    p_beans: reward.total,
    p_type: "bonus",
    p_stripe_id: `checkin:${user.id}:${today}`,
    p_amount_cents: null,
    p_currency: null,
  });
  return NextResponse.json({ streak, ...reward });
}
