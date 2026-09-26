"use client";

import { useState } from "react";
import { CHECKIN } from "@/config/engagement";
import { cn } from "@/lib/utils";
import { BrandIcon } from "../BrandIcon";

/** Daily check-in: 5 Flowers a day, +30 on day 7. Missing a day just restarts — no penalty. */
export function CheckInCard({ streak, claimedToday }: { streak: number; claimedToday: boolean }) {
  const [state, setState] = useState({ streak, claimed: claimedToday, reward: 0, busy: false, error: "" });
  const dayInCycle =
    ((state.streak - (state.claimed ? 1 : 0)) % CHECKIN.streakLength) + (state.claimed ? 1 : 0);

  const claim = async () => {
    setState((s) => ({ ...s, busy: true, error: "" }));
    const res = await fetch("/api/checkin", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (res.ok) setState({ streak: data.streak, claimed: true, reward: data.total, busy: false, error: "" });
    else
      setState((s) => ({
        ...s,
        busy: false,
        claimed: res.status === 409 || s.claimed,
        error: res.status === 409 ? "" : (data.error ?? "Try again"),
      }));
  };

  return (
    <section
      aria-labelledby="checkin"
      className="border-border bg-surface flex flex-wrap items-center gap-4 rounded-2xl border p-4"
    >
      <BrandIcon name="flowers" size={44} />
      <div className="min-w-0 flex-1">
        <h2 id="checkin" className="font-extrabold">
          {state.claimed
            ? state.reward
              ? `+${state.reward} Flowers — see you tomorrow!`
              : "Checked in today ✓"
            : "Daily check-in"}
        </h2>
        <ol className="mt-2 flex gap-1.5" aria-label={`Day ${dayInCycle} of ${CHECKIN.streakLength}`}>
          {Array.from({ length: CHECKIN.streakLength }, (_, i) => (
            <li
              key={i}
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-bold",
                i < dayInCycle ? "bg-primary text-black" : "bg-surface-2 text-muted",
                i === CHECKIN.streakLength - 1 && "w-9",
              )}
            >
              {i === CHECKIN.streakLength - 1 ? `+${CHECKIN.streakBonus}` : i + 1}
            </li>
          ))}
        </ol>
        {state.error && <p className="text-lover-ink mt-1 text-xs">{state.error}</p>}
      </div>
      {!state.claimed && (
        <button
          type="button"
          onClick={claim}
          disabled={state.busy}
          className="bg-primary rounded-xl px-4 py-2.5 text-sm font-bold text-black disabled:opacity-60"
        >
          {state.busy ? "Claiming…" : `Claim +${CHECKIN.daily} 🌸`}
        </button>
      )}
    </section>
  );
}
