import { after, NextResponse } from "next/server";
import { autoReviewReport } from "@/lib/moderation";
import { z } from "zod";
import { createRateLimiter } from "@/lib/rate-limit";
import { REPORT_REASON_IDS } from "@/lib/report";
import { supabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  target_type: z.enum(["character", "message", "user"]),
  target_id: z.string().min(1).max(100),
  reason: z.enum(REPORT_REASON_IDS),
  details: z.string().max(1000).optional(),
});

const allow = createRateLimiter({ limit: 10, windowMs: 60 * 60_000 });

/** Files a report as the signed-in user (RLS: reporter_id must be the caller). */
export async function POST(request: Request) {
  if (!supabaseConfigured)
    return NextResponse.json({ error: "Reporting isn't set up yet." }, { status: 503 });
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Log in to report." }, { status: 401 });
  if (!allow(user.id)) return NextResponse.json({ error: "Too many reports. Try later." }, { status: 429 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid report." }, { status: 400 });

  const { data: row, error } = await supabase
    .from("reports")
    .insert({ ...parsed.data, reporter_id: user.id })
    .select("id")
    .single();
  if (error) {
    console.error("report:", error.message);
    return NextResponse.json({ error: "Couldn't send the report." }, { status: 500 });
  }
  // Automated-first review runs after the response (spec §6.8).
  after(() => autoReviewReport(row.id).catch((e) => console.error("auto review:", e)));
  return NextResponse.json({ ok: true });
}
