import { NextResponse } from "next/server";
import { createRateLimiter } from "@/lib/rate-limit";
import { waitlistSchema } from "@/lib/waitlist/schema";
import { addToWaitlist, WaitlistNotConfiguredError } from "@/lib/waitlist/store";

const allow = createRateLimiter({
  limit: Number(process.env.WAITLIST_RATE_LIMIT_PER_MIN ?? 5),
  windowMs: 60_000,
});

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!allow(ip)) {
    return NextResponse.json({ error: "Too many tries. Please wait a minute." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = waitlistSchema.safeParse(body);
  if (!parsed.success) {
    // A filled honeypot means a bot: pretend success, store nothing.
    if (parsed.error.issues.some((i) => i.path[0] === "website")) {
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
  }

  try {
    await addToWaitlist({ email: parsed.data.email, consent: true, source: parsed.data.source });
  } catch (err) {
    console.error("waitlist:", err);
    const status = err instanceof WaitlistNotConfiguredError ? 503 : 500;
    return NextResponse.json(
      { error: "We couldn't save that right now. Please try again later." },
      { status },
    );
  }
  return NextResponse.json({ ok: true });
}
