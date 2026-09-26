"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { changeVisibility, deleteMyCharacter } from "@/app/app/c/[id]/actions";
import { buttonClass } from "../ui/button";

const LABEL = {
  private: "Private — only you",
  unlisted: "Unlisted — anyone with the link",
  public: "Public — listed in Explore",
};

export function OwnerPanel({
  id,
  visibility,
  status,
  note,
}: {
  id: string;
  visibility: "private" | "unlisted" | "public";
  status: string;
  note: string | null;
}) {
  const [confirming, setConfirming] = useState(false);
  return (
    <section aria-labelledby="owner" className="border-border bg-surface mt-6 rounded-xl border p-4">
      <h2 id="owner" className="text-sm font-extrabold">
        Your character
      </h2>
      {status === "pending" && (
        <p className="bg-primary mt-2 rounded-md px-2 py-1 text-xs font-semibold text-black">
          Waiting for review before it appears in Explore.
        </p>
      )}
      {status === "hidden" && (
        <p className="text-lover-ink mt-2 text-xs font-semibold">
          Hidden by moderation{note ? `: ${note}` : ""}.
        </p>
      )}
      {status !== "pending" && note && status !== "hidden" && (
        <p className="text-muted mt-2 text-xs">Moderator note: {note}</p>
      )}
      {status !== "hidden" && (
        <form action={changeVisibility} className="mt-3 flex flex-wrap items-center gap-2">
          <input type="hidden" name="character_id" value={id} />
          <label htmlFor="vis" className="sr-only">
            Visibility
          </label>
          <select
            id="vis"
            name="visibility"
            defaultValue={visibility}
            className="border-border bg-bg h-9 rounded-lg border px-2 text-sm"
          >
            {(Object.keys(LABEL) as (keyof typeof LABEL)[]).map((v) => (
              <option key={v} value={v}>
                {LABEL[v]}
              </option>
            ))}
          </select>
          <button className={buttonClass({ variant: "secondary", size: "sm" })}>Save</button>
        </form>
      )}
      <div className="mt-3">
        {confirming ? (
          <form action={deleteMyCharacter} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="character_id" value={id} />
            <input type="hidden" name="confirm" value="yes" />
            <span className="text-sm">Delete forever, including everyone&apos;s chats with them?</span>
            <button className={buttonClass({ size: "sm", className: "bg-lover hover:bg-lover text-white" })}>
              Delete
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className={buttonClass({ variant: "ghost", size: "sm" })}
            >
              Cancel
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="text-lover-ink flex items-center gap-1.5 text-sm font-semibold"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" /> Delete character
          </button>
        )}
      </div>
    </section>
  );
}
